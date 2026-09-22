package vn.duy.signlight.platform.seed;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.function.Function;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import vn.duy.signlight.airecognition.application.AiModelSyncService;
import vn.duy.signlight.content.domain.Chapter;
import vn.duy.signlight.content.domain.Course;
import vn.duy.signlight.content.domain.Exercise;
import vn.duy.signlight.content.domain.ExerciseOption;
import vn.duy.signlight.content.domain.Lesson;
import vn.duy.signlight.content.domain.Sign;
import vn.duy.signlight.content.domain.SignVideo;
import vn.duy.signlight.content.domain.Unit;
import vn.duy.signlight.content.repository.ChapterRepository;
import vn.duy.signlight.content.repository.CourseRepository;
import vn.duy.signlight.content.repository.ExerciseOptionRepository;
import vn.duy.signlight.content.repository.ExerciseRepository;
import vn.duy.signlight.content.repository.LessonRepository;
import vn.duy.signlight.content.repository.SignRepository;
import vn.duy.signlight.content.repository.SignVideoRepository;
import vn.duy.signlight.content.repository.UnitRepository;

/**
 * Nạp bộ nội dung giả lập từ {@code seed/vsl-seed.json} (SRS §3.4, việc V-4).
 *
 * <p><b>Idempotent</b>: chạy lại nhiều lần cho cùng một kết quả — khoá đối chiếu là {@code course.code}
 * và {@code sign.word}, không phải UUID sinh ngẫu nhiên. Nhờ vậy khởi động lại container không nhân
 * đôi nội dung.
 *
 * <p>Mọi bản ghi sinh ra mang {@code is_seed = true} (SEED-5). Bật/tắt bằng
 * {@code signlight.seed.enabled} — ở prod phải là {@code false}.
 */
@Component
@ConditionalOnProperty(name = "signlight.seed.enabled", havingValue = "true")
public class SeedRunner implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(SeedRunner.class);
    private static final String SEED_RESOURCE = "seed/vsl-seed.json";
    private static final String STATUS_PUBLISHED = "PUBLISHED";

    private final ObjectMapper objectMapper;
    private final CourseRepository courseRepository;
    private final UnitRepository unitRepository;
    private final ChapterRepository chapterRepository;
    private final LessonRepository lessonRepository;
    private final ExerciseRepository exerciseRepository;
    private final ExerciseOptionRepository optionRepository;
    private final SignRepository signRepository;
    private final SignVideoRepository signVideoRepository;
    private final AiModelSyncService aiModelSyncService;

    public SeedRunner(ObjectMapper objectMapper,
            CourseRepository courseRepository,
            UnitRepository unitRepository,
            ChapterRepository chapterRepository,
            LessonRepository lessonRepository,
            ExerciseRepository exerciseRepository,
            ExerciseOptionRepository optionRepository,
            SignRepository signRepository,
            SignVideoRepository signVideoRepository,
            AiModelSyncService aiModelSyncService) {
        this.objectMapper = objectMapper;
        this.courseRepository = courseRepository;
        this.unitRepository = unitRepository;
        this.chapterRepository = chapterRepository;
        this.lessonRepository = lessonRepository;
        this.exerciseRepository = exerciseRepository;
        this.optionRepository = optionRepository;
        this.signRepository = signRepository;
        this.signVideoRepository = signVideoRepository;
        this.aiModelSyncService = aiModelSyncService;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) throws IOException {
        SeedData data;
        try (var stream = new ClassPathResource(SEED_RESOURCE).getInputStream()) {
            data = objectMapper.readValue(stream, SeedData.class);
        }

        Course course = upsertCourse(data.course());
        Map<String, Sign> signsByWord = upsertSigns(course, data.signs());
        upsertUnits(course, data.units(), signsByWord);

        log.info("seed_loaded courseCode={} signs={} units={}",
                course.getCode(), signsByWord.size(), data.units().size());

        // Nhãn AI chỉ ánh xạ được sau khi ký hiệu đã có trong CSDL, nên đồng bộ sau seed.
        aiModelSyncService.sync().ifPresentOrElse(
                summary -> log.info("seed_ai_sync modelVersion={} mapped={} orphaned={} stub={}",
                        summary.modelVersion(), summary.mapped(), summary.orphaned(),
                        summary.stubMode()),
                () -> log.warn("seed_ai_sync_skipped reason=ai_service_unavailable"));
    }

    // -------------------------------------------------------------------- khoá

    private Course upsertCourse(SeedCourse seed) {
        Course course = courseRepository.findByCode(seed.code())
                .orElseGet(() -> Course.builder().id(UUID.randomUUID()).code(seed.code()).build());
        course.setName(seed.name());
        course.setStatus(seed.status());
        course.setAlphabetLetters(seed.alphabetLetters());
        course.setSeed(true);
        return courseRepository.save(course);
    }

    // ---------------------------------------------------------------- ký hiệu

    private Map<String, Sign> upsertSigns(Course course, List<SeedSign> seeds) {
        Map<String, Sign> existing = signRepository.findAll().stream()
                .filter(sign -> sign.getCourseId().equals(course.getId()))
                .collect(java.util.stream.Collectors.toMap(Sign::getWord, Function.identity(),
                        (first, second) -> first));

        for (SeedSign seed : seeds) {
            Sign sign = existing.getOrDefault(seed.word(), Sign.builder()
                    .id(UUID.randomUUID())
                    .courseId(course.getId())
                    .word(seed.word())
                    .build());
            sign.setMeaning(seed.meaning());
            sign.setTopic(seed.topic());
            sign.setWordClass(seed.wordClass());
            sign.setDescription(seed.meaning());
            sign.setStatus(STATUS_PUBLISHED);
            sign.setSeed(true);
            signRepository.save(sign);
            existing.put(seed.word(), sign);

            upsertSignVideo(sign, seed.video());
        }
        return existing;
    }

    /**
     * Nạp hoặc cập nhật biến thể video cho ký hiệu.
     * Nếu seed có thông tin video thực tế (web MP4 hoặc raw front-view), lưu đường dẫn thật;
     * nếu không, tạo placeholder dự phòng.
     */
    private void upsertSignVideo(Sign sign, SeedVideo seedVideo) {
        List<SignVideo> existingVideos = signVideoRepository.findBySignId(sign.getId());
        SignVideo video = existingVideos.stream()
                .filter(SignVideo::isPrimaryVariant)
                .findFirst()
                .orElseGet(() -> existingVideos.isEmpty() ? null : existingVideos.get(0));

        if (video == null) {
            video = SignVideo.builder()
                    .id(UUID.randomUUID())
                    .signId(sign.getId())
                    .primaryVariant(true)
                    .build();
        }

        if (seedVideo != null) {
            if (seedVideo.driveFileId() != null && !seedVideo.driveFileId().isBlank()) {
                video.setDriveFileId(seedVideo.driveFileId());
                video.setStorageProvider("GDRIVE");
                video.setDirectUrl(seedVideo.directUrl());
            } else if (seedVideo.storageProvider() != null) {
                video.setStorageProvider(seedVideo.storageProvider());
            }
            if (seedVideo.objectKey() != null) {
                video.setObjectKey(seedVideo.objectKey());
            }
            video.setStatus("READY");
            video.setRegionLabel(seedVideo.regionLabel() != null ? seedVideo.regionLabel() : "Toàn quốc");
            video.setSignerLabel(seedVideo.signerLabel() != null ? seedVideo.signerLabel() : "Người ký hiệu mẫu");
            video.setDurationMs(seedVideo.durationMs() != null ? seedVideo.durationMs() : 2000);
            video.setSeed(true);
            video.setPrimaryVariant(true);
            signVideoRepository.save(video);
        } else if (video.getObjectKey() == null && video.getDriveFileId() == null) {
            video.setStorageProvider("GDRIVE");
            video.setObjectKey("seed/placeholder/" + sign.getId() + ".mp4");
            video.setStatus("READY");
            video.setRegionLabel("Miền Bắc");
            video.setSignerLabel("Người ký hiệu mẫu");
            video.setDurationMs(2000);
            video.setSeed(true);
            video.setPrimaryVariant(true);
            signVideoRepository.save(video);
        }
    }

    // ------------------------------------------------------------ lộ trình học

    private void upsertUnits(Course course, List<SeedUnit> seeds, Map<String, Sign> signsByWord) {
        List<Unit> existingUnits = unitRepository.findByCourseIdOrderByOrderIndexAsc(course.getId());

        for (int unitIndex = 0; unitIndex < seeds.size(); unitIndex++) {
            SeedUnit seedUnit = seeds.get(unitIndex);
            final int currentUnitIndex = unitIndex;
            Unit unit = existingUnits.stream()
                    .filter(candidate -> candidate.getOrderIndex() == currentUnitIndex)
                    .findFirst()
                    .orElseGet(() -> Unit.builder()
                            .id(UUID.randomUUID())
                            .courseId(course.getId())
                            .orderIndex(currentUnitIndex)
                            .build());
            unit.setTitle(seedUnit.title());
            unit.setFree(seedUnit.free());
            unit.setSeed(true);
            unitRepository.save(unit);

            upsertChapters(unit, seedUnit.chapters(), signsByWord);
        }
    }

    private void upsertChapters(Unit unit, List<SeedChapter> seeds, Map<String, Sign> signsByWord) {
        List<Chapter> existing = chapterRepository.findByUnitIdInOrderByOrderIndexAsc(
                List.of(unit.getId()));

        for (int chapterIndex = 0; chapterIndex < seeds.size(); chapterIndex++) {
            SeedChapter seedChapter = seeds.get(chapterIndex);
            final int currentChapterIndex = chapterIndex;
            Chapter chapter = existing.stream()
                    .filter(candidate -> candidate.getOrderIndex() == currentChapterIndex)
                    .findFirst()
                    .orElseGet(() -> Chapter.builder()
                            .id(UUID.randomUUID())
                            .unitId(unit.getId())
                            .orderIndex(currentChapterIndex)
                            .quizPassPercent((short) 80)
                            .build());
            chapter.setTitle(seedChapter.title());
            chapter.setSeed(true);
            chapterRepository.save(chapter);

            upsertLessons(chapter, seedChapter.lessons(), signsByWord);
        }
    }

    private void upsertLessons(Chapter chapter, List<SeedLesson> seeds, Map<String, Sign> signsByWord) {
        List<Lesson> existing = lessonRepository.findByChapterIdInAndStatusOrderByOrderIndexAsc(
                List.of(chapter.getId()), STATUS_PUBLISHED);

        for (int lessonIndex = 0; lessonIndex < seeds.size(); lessonIndex++) {
            SeedLesson seedLesson = seeds.get(lessonIndex);
            final int currentLessonIndex = lessonIndex;
            Lesson lesson = existing.stream()
                    .filter(candidate -> candidate.getOrderIndex() == currentLessonIndex)
                    .findFirst()
                    .orElseGet(() -> Lesson.builder()
                            .id(UUID.randomUUID())
                            .chapterId(chapter.getId())
                            .orderIndex(currentLessonIndex)
                            .type("STANDARD")
                            .build());
            lesson.setTitle(seedLesson.title());
            lesson.setEstimatedMinutes((short) seedLesson.estimatedMinutes());
            lesson.setStatus(STATUS_PUBLISHED);
            lesson.setSeed(true);
            lessonRepository.save(lesson);

            upsertExercises(lesson, seedLesson.exercises(), signsByWord);
        }
    }

    private void upsertExercises(Lesson lesson, List<SeedExercise> seeds,
            Map<String, Sign> signsByWord) {
        List<Exercise> existing = exerciseRepository.findByLessonIdOrderByOrderIndexAsc(lesson.getId());

        for (int exerciseIndex = 0; exerciseIndex < seeds.size(); exerciseIndex++) {
            SeedExercise seedExercise = seeds.get(exerciseIndex);
            final int currentExerciseIndex = exerciseIndex;
            Exercise exercise = existing.stream()
                    .filter(candidate -> candidate.getOrderIndex() == currentExerciseIndex)
                    .findFirst()
                    .orElseGet(() -> Exercise.builder()
                            .id(UUID.randomUUID())
                            .lessonId(lesson.getId())
                            .orderIndex(currentExerciseIndex)
                            .build());
            Sign sign = signsByWord.get(seedExercise.sign());
            exercise.setType(seedExercise.type());
            exercise.setSignId(sign == null ? null : sign.getId());
            exercise.setPromptText(seedExercise.prompt());
            exercise.setCorrectAnswerText(seedExercise.answer());
            exercise.setAcceptedAnswers(writeJson(
                    Optional.ofNullable(seedExercise.acceptedAnswers()).orElse(List.of())));
            exercise.setSeed(true);
            exerciseRepository.save(exercise);

            upsertOptions(exercise, seedExercise);
        }
    }

    /** Lựa chọn đầu tiên trong seed là đáp án đúng; thứ tự hiển thị do giao diện xáo. */
    private void upsertOptions(Exercise exercise, SeedExercise seedExercise) {
        if (seedExercise.options() == null || seedExercise.options().isEmpty()) {
            return;
        }
        if (!optionRepository.findByExerciseIdOrderByOrderIndexAsc(exercise.getId()).isEmpty()) {
            return;
        }
        List<String> options = seedExercise.options();
        for (int index = 0; index < options.size(); index++) {
            optionRepository.save(ExerciseOption.builder()
                    .id(UUID.randomUUID())
                    .exerciseId(exercise.getId())
                    .orderIndex(index)
                    .correct(index == 0)
                    .labelText(options.get(index))
                    .seed(true)
                    .build());
        }
    }

    private String writeJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (com.fasterxml.jackson.core.JsonProcessingException ex) {
            return "[]";
        }
    }

    // ------------------------------------------------- hình dạng file seed

    @com.fasterxml.jackson.annotation.JsonIgnoreProperties(ignoreUnknown = true)
    record SeedData(int seedVersion, SeedCourse course, List<SeedSign> signs, List<SeedUnit> units) {
    }

    @com.fasterxml.jackson.annotation.JsonIgnoreProperties(ignoreUnknown = true)
    record SeedCourse(String code, String name, String alphabetLetters, String status) {
    }

    @com.fasterxml.jackson.annotation.JsonIgnoreProperties(ignoreUnknown = true)
    record SeedVideo(String objectKey, String videoId, Integer durationMs, String regionLabel, String signerLabel,
                     String driveFileId, String directUrl, String storageProvider) {
    }

    @com.fasterxml.jackson.annotation.JsonIgnoreProperties(ignoreUnknown = true)
    record SeedSign(String word, String meaning, String topic, String wordClass,
                    boolean aiVocabulary, SeedVideo video) {
    }

    @com.fasterxml.jackson.annotation.JsonIgnoreProperties(ignoreUnknown = true)
    record SeedUnit(String title, boolean free, List<SeedChapter> chapters) {
    }

    @com.fasterxml.jackson.annotation.JsonIgnoreProperties(ignoreUnknown = true)
    record SeedChapter(String title, List<SeedLesson> lessons) {
    }

    @com.fasterxml.jackson.annotation.JsonIgnoreProperties(ignoreUnknown = true)
    record SeedLesson(String title, int estimatedMinutes, List<SeedExercise> exercises) {
    }

    @com.fasterxml.jackson.annotation.JsonIgnoreProperties(ignoreUnknown = true)
    record SeedExercise(String type, String sign, String prompt, List<String> options,
                        String answer, List<String> acceptedAnswers) {
    }
}
