package vn.duy.signlight.content.application;

import java.util.Collection;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.duy.signlight.common.error.BusinessException;
import vn.duy.signlight.common.error.ErrorCode;
import vn.duy.signlight.content.domain.Chapter;
import vn.duy.signlight.content.domain.Exercise;
import vn.duy.signlight.content.domain.ExerciseOption;
import vn.duy.signlight.content.domain.Lesson;
import vn.duy.signlight.content.domain.Sign;
import vn.duy.signlight.content.domain.SignVideo;
import vn.duy.signlight.content.domain.Unit;
import vn.duy.signlight.content.repository.ChapterRepository;
import vn.duy.signlight.content.repository.ExerciseOptionRepository;
import vn.duy.signlight.content.repository.ExerciseRepository;
import vn.duy.signlight.content.repository.LessonRepository;
import vn.duy.signlight.content.repository.SignRepository;
import vn.duy.signlight.content.repository.SignVideoRepository;
import vn.duy.signlight.content.repository.UnitRepository;

/**
 * Đọc cây nội dung đã xuất bản. Module `learning` ghép tiến độ lên cây này thay vì tự truy vấn
 * repository của `content`.
 */
@Service
public class ContentTreeService {

    private final UnitRepository unitRepository;
    private final ChapterRepository chapterRepository;
    private final LessonRepository lessonRepository;
    private final ExerciseRepository exerciseRepository;
    private final ExerciseOptionRepository optionRepository;
    private final SignRepository signRepository;
    private final SignVideoRepository signVideoRepository;

    public ContentTreeService(UnitRepository unitRepository,
            ChapterRepository chapterRepository,
            LessonRepository lessonRepository,
            ExerciseRepository exerciseRepository,
            ExerciseOptionRepository optionRepository,
            SignRepository signRepository,
            SignVideoRepository signVideoRepository) {
        this.unitRepository = unitRepository;
        this.chapterRepository = chapterRepository;
        this.lessonRepository = lessonRepository;
        this.exerciseRepository = exerciseRepository;
        this.optionRepository = optionRepository;
        this.signRepository = signRepository;
        this.signVideoRepository = signVideoRepository;
    }

    /** Cây Unit → Chapter → Lesson của một khoá, chỉ gồm bài học đã {@code PUBLISHED}. */
    @Transactional(readOnly = true)
    public CourseTree tree(UUID courseId) {
        List<Unit> units = unitRepository.findByCourseIdOrderByOrderIndexAsc(courseId);
        if (units.isEmpty()) {
            return new CourseTree(List.of(), Map.of(), Map.of());
        }
        List<UUID> unitIds = units.stream().map(Unit::getId).toList();
        List<Chapter> chapters = chapterRepository.findByUnitIdInOrderByOrderIndexAsc(unitIds);

        Map<UUID, List<Chapter>> chaptersByUnit = chapters.stream()
                .collect(Collectors.groupingBy(Chapter::getUnitId));

        Map<UUID, List<Lesson>> lessonsByChapter = Map.of();
        if (!chapters.isEmpty()) {
            List<UUID> chapterIds = chapters.stream().map(Chapter::getId).toList();
            lessonsByChapter = lessonRepository
                    .findByChapterIdInAndStatusOrderByOrderIndexAsc(
                            chapterIds, ContentCatalogService.STATUS_PUBLISHED)
                    .stream()
                    .collect(Collectors.groupingBy(Lesson::getChapterId));
        }
        return new CourseTree(units, chaptersByUnit, lessonsByChapter);
    }

    @Transactional(readOnly = true)
    public Lesson requirePublishedLesson(UUID lessonId) {
        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND));
        if (!ContentCatalogService.STATUS_PUBLISHED.equals(lesson.getStatus())) {
            throw new BusinessException(ErrorCode.CONTENT_NOT_PUBLISHED);
        }
        return lesson;
    }

    /** Lần ngược Lesson → Chapter → Unit để biết bài học thuộc khoá nào. */
    @Transactional(readOnly = true)
    public UUID courseIdOfLesson(Lesson lesson) {
        Chapter chapter = chapterRepository.findById(lesson.getChapterId())
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND));
        Unit unit = unitRepository.findById(chapter.getUnitId())
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND));
        return unit.getCourseId();
    }

    @Transactional(readOnly = true)
    public List<Exercise> exercisesOf(UUID lessonId) {
        return exerciseRepository.findByLessonIdOrderByOrderIndexAsc(lessonId);
    }

    @Transactional(readOnly = true)
    public Optional<Exercise> exercise(UUID exerciseId) {
        return exerciseRepository.findById(exerciseId);
    }

    @Transactional(readOnly = true)
    public Map<UUID, List<ExerciseOption>> optionsOf(Collection<UUID> exerciseIds) {
        if (exerciseIds.isEmpty()) {
            return Map.of();
        }
        return optionRepository.findByExerciseIdInOrderByOrderIndexAsc(exerciseIds).stream()
                .collect(Collectors.groupingBy(ExerciseOption::getExerciseId));
    }

    @Transactional(readOnly = true)
    public List<ExerciseOption> optionsOf(UUID exerciseId) {
        return optionRepository.findByExerciseIdOrderByOrderIndexAsc(exerciseId);
    }

    @Transactional(readOnly = true)
    public Optional<Sign> publishedSign(UUID signId) {
        return signRepository.findByIdAndStatus(signId, ContentCatalogService.STATUS_PUBLISHED);
    }

    @Transactional(readOnly = true)
    public List<Sign> publishedSigns(Collection<UUID> signIds) {
        if (signIds.isEmpty()) {
            return List.of();
        }
        return signRepository.findByIdInAndStatus(signIds, ContentCatalogService.STATUS_PUBLISHED);
    }

    /** Video chính của một ký hiệu (biến thể mặc định — BR-A43). */
    @Transactional(readOnly = true)
    public Optional<SignVideo> primaryVideo(UUID signId) {
        return signVideoRepository.findBySignId(signId).stream()
                .max(Comparator.comparing(SignVideo::isPrimaryVariant));
    }

    @Transactional(readOnly = true)
    public Map<UUID, SignVideo> primaryVideos(Collection<UUID> signIds) {
        if (signIds.isEmpty()) {
            return Map.of();
        }
        return signVideoRepository.findBySignIdInOrderByPrimaryVariantDesc(signIds).stream()
                .collect(Collectors.toMap(SignVideo::getSignId, video -> video,
                        (first, second) -> first));
    }

    /** Cây nội dung thô — chưa gắn tiến độ của người học. */
    public record CourseTree(
            List<Unit> units,
            Map<UUID, List<Chapter>> chaptersByUnit,
            Map<UUID, List<Lesson>> lessonsByChapter) {
    }
}
