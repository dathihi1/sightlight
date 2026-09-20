package vn.duy.signlight.learning.application;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.duy.signlight.content.application.ContentCatalogService;
import vn.duy.signlight.content.application.ContentTreeService;
import vn.duy.signlight.content.domain.Chapter;
import vn.duy.signlight.content.domain.Course;
import vn.duy.signlight.content.domain.Lesson;
import vn.duy.signlight.content.domain.Unit;
import vn.duy.signlight.identity.application.AuthService;
import vn.duy.signlight.learning.domain.UserLessonState;
import vn.duy.signlight.learning.repository.UserLessonStateRepository;
import vn.duy.signlight.learning.web.dto.LearningPathResult;

/**
 * Dựng lộ trình học kèm tiến độ (FR-09, api-spec §3.4).
 *
 * <p>Hai loại khoá khác nhau và <b>không</b> được trộn lẫn:
 * <ul>
 *   <li>{@code locked} — chưa học xong bài trước (BR-A12);</li>
 *   <li>{@code premiumLocked} — Unit không miễn phí và người học chưa có Premium (BR-A14).</li>
 * </ul>
 * Giao diện hiển thị hai thông điệp khác nhau nên backend phải phân biệt rõ.
 */
@Service
public class LearningPathService {

    private final ContentCatalogService contentCatalog;
    private final ContentTreeService contentTree;
    private final UserLessonStateRepository lessonStateRepository;
    private final AuthService authService;

    public LearningPathService(ContentCatalogService contentCatalog,
            ContentTreeService contentTree,
            UserLessonStateRepository lessonStateRepository,
            AuthService authService) {
        this.contentCatalog = contentCatalog;
        this.contentTree = contentTree;
        this.lessonStateRepository = lessonStateRepository;
        this.authService = authService;
    }

    @Transactional(readOnly = true)
    public LearningPathResult path(UUID userId, UUID courseId) {
        Course course = contentCatalog.requirePublishedCourse(courseId);
        ContentTreeService.CourseTree tree = contentTree.tree(courseId);
        boolean premium = authService.isPremium(userId);

        Map<UUID, UserLessonState> progress = lessonStateRepository.findByUserId(userId).stream()
                .collect(Collectors.toMap(UserLessonState::getLessonId, Function.identity()));

        List<LearningPathResult.UnitNode> unitNodes = new ArrayList<>();
        UUID nextLessonId = null;
        boolean previousCompleted = true;   // bài đầu tiên của khoá luôn mở

        for (Unit unit : tree.units()) {
            boolean premiumLocked = !unit.isFree() && !premium;
            List<LearningPathResult.ChapterNode> chapterNodes = new ArrayList<>();

            for (Chapter chapter : tree.chaptersByUnit().getOrDefault(unit.getId(), List.of())) {
                List<LearningPathResult.LessonNode> lessonNodes = new ArrayList<>();

                for (Lesson lesson : tree.lessonsByChapter().getOrDefault(chapter.getId(), List.of())) {
                    UserLessonState state = progress.get(lesson.getId());
                    String status = state == null ? UserLessonState.NOT_STARTED : state.getStatus();
                    boolean completed = UserLessonState.COMPLETED.equals(status);
                    boolean locked = !previousCompleted;

                    lessonNodes.add(new LearningPathResult.LessonNode(
                            lesson.getId(), lesson.getTitle(), status, locked, premiumLocked,
                            state == null ? null : state.getBestScorePercent()));

                    if (nextLessonId == null && !completed && !locked && !premiumLocked) {
                        nextLessonId = lesson.getId();
                    }
                    previousCompleted = completed;
                }
                chapterNodes.add(new LearningPathResult.ChapterNode(
                        chapter.getId(), chapter.getTitle(), false, lessonNodes));
            }
            unitNodes.add(new LearningPathResult.UnitNode(
                    unit.getId(), unit.getTitle(), unit.isFree(), 0, chapterNodes));
        }

        return new LearningPathResult(course.getId(), course.getName(), nextLessonId, unitNodes);
    }

    /** Bài học có mở khoá cho người này không — dùng lại ở {@code LessonService} trước khi trả nội dung. */
    @Transactional(readOnly = true)
    public Access accessTo(UUID userId, Lesson lesson) {
        LearningPathResult path = pathOfLesson(userId, lesson);
        for (LearningPathResult.UnitNode unit : path.units()) {
            for (LearningPathResult.ChapterNode chapter : unit.chapters()) {
                for (LearningPathResult.LessonNode node : chapter.lessons()) {
                    if (node.id().equals(lesson.getId())) {
                        return new Access(!node.locked(), node.premiumLocked());
                    }
                }
            }
        }
        return new Access(false, false);
    }

    private LearningPathResult pathOfLesson(UUID userId, Lesson lesson) {
        UUID courseId = contentTree.courseIdOfLesson(lesson);
        return path(userId, courseId);
    }

    /** Kết quả kiểm quyền truy cập một bài học. */
    public record Access(boolean unlocked, boolean premiumLocked) {
    }
}
