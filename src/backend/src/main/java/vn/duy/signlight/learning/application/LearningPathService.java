package vn.duy.signlight.learning.application;

import java.util.ArrayList;
import java.time.Instant;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.duy.signlight.content.application.ContentCatalogService;
import vn.duy.signlight.content.application.ContentTreeService;
import vn.duy.signlight.content.domain.Chapter;
import vn.duy.signlight.content.domain.Course;
import vn.duy.signlight.content.domain.Lesson;
import vn.duy.signlight.content.domain.Unit;
import vn.duy.signlight.gamification.repository.UserInventoryRepository;
import vn.duy.signlight.identity.application.AuthService;
import vn.duy.signlight.learning.domain.UserLessonState;
import vn.duy.signlight.learning.domain.UserUnlockedLesson;
import vn.duy.signlight.learning.repository.LearnerCourseQueryRepository;
import vn.duy.signlight.learning.repository.UserLessonStateRepository;
import vn.duy.signlight.learning.repository.UserUnlockedLessonRepository;
import vn.duy.signlight.learning.web.dto.ChapterLessonsResult;
import vn.duy.signlight.learning.web.dto.CourseOverviewResult;
import vn.duy.signlight.learning.web.dto.LearningPathResult;

/**
 * Dựng lộ trình học kèm tiến độ (FR-09, api-spec §3.4).
 *
 * <p>Cả 17 chủ đề đều miễn phí. {@code locked} chỉ có nghĩa là người học chưa
 * hoàn thành bài liền trước trong cùng chủ đề. Người học có thể chủ động mở nhanh từng bài bằng
 * EXP hoặc vé mở khóa.
 */
@Service
public class LearningPathService {

    private final ContentCatalogService contentCatalog;
    private final ContentTreeService contentTree;
    private final UserLessonStateRepository lessonStateRepository;
    private final AuthService authService;
    private final UserInventoryRepository userInventoryRepository;
    private final UserUnlockedLessonRepository unlockedLessonRepository;
    private final LearnerCourseQueryRepository learnerQueries;

    @Autowired
    public LearningPathService(ContentCatalogService contentCatalog,
            ContentTreeService contentTree,
            UserLessonStateRepository lessonStateRepository,
            AuthService authService,
            @Autowired(required = false) UserInventoryRepository userInventoryRepository,
            @Autowired(required = false) UserUnlockedLessonRepository unlockedLessonRepository,
            @Autowired(required = false) LearnerCourseQueryRepository learnerQueries) {
        this.contentCatalog = contentCatalog;
        this.contentTree = contentTree;
        this.lessonStateRepository = lessonStateRepository;
        this.authService = authService;
        this.userInventoryRepository = userInventoryRepository;
        this.unlockedLessonRepository = unlockedLessonRepository;
        this.learnerQueries = learnerQueries;
    }

    public LearningPathService(ContentCatalogService contentCatalog,
            ContentTreeService contentTree,
            UserLessonStateRepository lessonStateRepository,
            AuthService authService) {
        this(contentCatalog, contentTree, lessonStateRepository, authService, null, null, null);
    }

    public LearningPathService(ContentCatalogService contentCatalog,
            ContentTreeService contentTree,
            UserLessonStateRepository lessonStateRepository,
            AuthService authService,
            UserInventoryRepository userInventoryRepository,
            UserUnlockedLessonRepository unlockedLessonRepository) {
        this(contentCatalog, contentTree, lessonStateRepository, authService,
                userInventoryRepository, unlockedLessonRepository, null);
    }

    @Transactional(readOnly = true)
    public CourseOverviewResult overview(UUID userId, UUID courseId) {
        Course course = contentCatalog.requirePublishedCourse(courseId);
        LearnerCourseQueryRepository queries = requireOptimizedQueries();
        List<LearnerCourseQueryRepository.OverviewChapterView> chapters =
                queries.overviewChapters(userId, courseId);
        Map<UUID, List<LearnerCourseQueryRepository.OverviewChapterView>> chaptersByUnit = chapters.stream()
                .collect(Collectors.groupingBy(LearnerCourseQueryRepository.OverviewChapterView::unitId));
        List<LearnerCourseQueryRepository.OverviewUnitView> units = queries.overviewUnits(userId, courseId);

        List<CourseOverviewResult.UnitOverview> unitResults = units.stream()
                .map(unit -> new CourseOverviewResult.UnitOverview(
                        unit.id(), unit.title(), true,
                        Math.toIntExact(unit.lessonCount()),
                        Math.toIntExact(unit.completedLessons()),
                        roundedAverage(unit.averageScore()),
                        chaptersByUnit.getOrDefault(unit.id(), List.of()).stream()
                                .map(chapter -> new CourseOverviewResult.ChapterOverview(
                                        chapter.id(), chapter.title(),
                                        Math.toIntExact(chapter.lessonCount()),
                                        Math.toIntExact(chapter.completedLessons()), false))
                                .toList()))
                .toList();

        long totalLessons = units.stream().mapToLong(LearnerCourseQueryRepository.OverviewUnitView::lessonCount).sum();
        long completedLessons = units.stream().mapToLong(LearnerCourseQueryRepository.OverviewUnitView::completedLessons).sum();
        double weightedScore = units.stream()
                .mapToDouble(unit -> unit.averageScore() * unit.completedLessons())
                .sum();
        int averageScore = completedLessons == 0 ? 0 : roundedAverage(weightedScore / completedLessons);
        CourseOverviewResult.NextLesson nextLesson = queries.nextLesson(userId, courseId)
                .map(item -> new CourseOverviewResult.NextLesson(
                        item.id(), item.chapterId(), item.title(), item.status()))
                .orElse(null);

        return new CourseOverviewResult(course.getId(), course.getName(),
                Math.toIntExact(totalLessons), Math.toIntExact(completedLessons), averageScore,
                nextLesson, unitResults);
    }

    @Transactional(readOnly = true)
    public ChapterLessonsResult chapterLessons(UUID userId, UUID courseId, UUID chapterId,
            int page, int size) {
        if (page < 0 || size < 1 || size > 100) {
            throw new vn.duy.signlight.common.error.BusinessException(
                    vn.duy.signlight.common.error.ErrorCode.INVALID_PAYLOAD);
        }
        contentCatalog.requirePublishedCourse(courseId);
        LearnerCourseQueryRepository.ChapterLessonPage result = requireOptimizedQueries()
                .chapterLessons(userId, courseId, chapterId, page, size);
        if (!result.chapterFound()) {
            throw new vn.duy.signlight.common.error.BusinessException(
                    vn.duy.signlight.common.error.ErrorCode.NOT_FOUND);
        }
        List<ChapterLessonsResult.LessonItem> items = result.items().stream()
                .map(item -> new ChapterLessonsResult.LessonItem(
                        item.id(), item.title(), item.status(), item.locked(), false,
                        item.bestScorePercent()))
                .toList();
        int totalPages = result.totalElements() == 0
                ? 0
                : Math.toIntExact((result.totalElements() + size - 1) / size);
        return new ChapterLessonsResult(items, totalPages, result.totalElements(), page);
    }

    @Transactional(readOnly = true)
    public UUID nextLessonId(UUID userId, UUID courseId) {
        return requireOptimizedQueries().nextLesson(userId, courseId)
                .map(LearnerCourseQueryRepository.LessonSummaryView::id)
                .orElse(null);
    }

    private LearnerCourseQueryRepository requireOptimizedQueries() {
        if (learnerQueries == null) {
            throw new IllegalStateException("Learner course queries are not configured");
        }
        return learnerQueries;
    }

    private int roundedAverage(double value) {
        return (int) Math.round(value);
    }

    @Transactional(readOnly = true)
    public LearningPathResult path(UUID userId, UUID courseId) {
        Course course = contentCatalog.requirePublishedCourse(courseId);
        ContentTreeService.CourseTree tree = contentTree.tree(courseId);
        Map<UUID, UserLessonState> progress = userId == null
                ? Map.of()
                : lessonStateRepository.findByUserId(userId).stream()
                        .collect(Collectors.toMap(UserLessonState::getLessonId, Function.identity()));
        java.util.Set<UUID> manuallyUnlockedLessonIds = userId == null || unlockedLessonRepository == null
                ? java.util.Set.of()
                : unlockedLessonRepository.findAllActiveUnlocks(userId, Instant.now()).stream()
                        .map(UserUnlockedLesson::getLessonId)
                        .collect(Collectors.toCollection(HashSet::new));

        List<LearningPathResult.UnitNode> unitNodes = new ArrayList<>();
        UUID nextLessonId = null;
        for (Unit unit : tree.units()) {
            boolean premiumLocked = false;   // Toàn bộ 17 Units mở miễn phí cho mọi người học
            List<LearningPathResult.ChapterNode> chapterNodes = new ArrayList<>();
            boolean unitLessonPreviousCompleted = true; // Mở bài đầu tiên của mỗi Unit để học tự do

            for (Chapter chapter : tree.chaptersByUnit().getOrDefault(unit.getId(), List.of())) {
                List<LearningPathResult.LessonNode> lessonNodes = new ArrayList<>();

                for (Lesson lesson : tree.lessonsByChapter().getOrDefault(chapter.getId(), List.of())) {
                    UserLessonState state = progress.get(lesson.getId());
                    String status = state == null ? UserLessonState.NOT_STARTED : state.getStatus();
                    boolean completed = UserLessonState.COMPLETED.equals(status);
                    boolean locked = !unitLessonPreviousCompleted
                            && !manuallyUnlockedLessonIds.contains(lesson.getId());

                    lessonNodes.add(new LearningPathResult.LessonNode(
                            lesson.getId(), lesson.getTitle(), status, locked, premiumLocked,
                            state == null ? null : state.getBestScorePercent()));

                    if (nextLessonId == null && !completed && !locked && !premiumLocked) {
                        nextLessonId = lesson.getId();
                    }
                    unitLessonPreviousCompleted = completed;
                }
                chapterNodes.add(new LearningPathResult.ChapterNode(
                        chapter.getId(), chapter.getTitle(), false, lessonNodes));
            }
            unitNodes.add(new LearningPathResult.UnitNode(
                    unit.getId(), unit.getTitle(), true, 0, chapterNodes));
        }

        return new LearningPathResult(course.getId(), course.getName(), nextLessonId, unitNodes);
    }

    /** Bài học có mở khoá cho người này không — truy vấn đúng một quyết định quyền truy cập. */
    @Transactional(readOnly = true)
    public Access accessTo(UUID userId, Lesson lesson) {
        if (userId != null && unlockedLessonRepository != null
                && unlockedLessonRepository.findActiveUnlock(userId, lesson.getId(), Instant.now()).isPresent()) {
            return new Access(true, false);
        }
        return requireOptimizedQueries().lessonAccess(userId, lesson.getId())
                .map(view -> new Access(view.unlocked(), false))
                .orElse(new Access(false, false));
    }

    /** Kết quả kiểm quyền truy cập một bài học. */
    public record Access(boolean unlocked, boolean premiumLocked) {
    }
}
