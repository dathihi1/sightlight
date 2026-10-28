package vn.duy.signlight.learning.repository;

import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Repository;
import vn.duy.signlight.learning.domain.UserLessonState;

/** PostgreSQL projections that keep learner reads bounded and ordered at the database. */
@Repository
public class JpaLearnerCourseQueryRepository implements LearnerCourseQueryRepository {

    private static final String ORDERED_LESSONS_CTE = """
            WITH ordered AS (
                SELECT l.id, l.chapter_id, l.title, u.id AS unit_id,
                       u.order_index AS unit_order, c.order_index AS chapter_order,
                       l.order_index AS lesson_order,
                       row_number() OVER (
                           PARTITION BY u.id
                           ORDER BY c.order_index, l.order_index, l.id) AS unit_rank,
                       lag(l.id) OVER (
                           PARTITION BY u.id
                           ORDER BY c.order_index, l.order_index, l.id) AS predecessor_id
                FROM lesson l
                JOIN chapter c ON c.id = l.chapter_id
                JOIN unit u ON u.id = c.unit_id
                WHERE u.course_id = :courseId AND l.status = 'PUBLISHED'
            ), decisions AS (
                SELECT o.*,
                       coalesce(s.status, 'NOT_STARTED') AS progress_status,
                       s.best_score_percent,
                       CASE
                           WHEN o.unit_rank = 1 THEN false
                           WHEN previous.status = 'COMPLETED' THEN false
                           ELSE true
                       END AS sequentially_locked
                FROM ordered o
                LEFT JOIN user_lesson_state s
                  ON s.lesson_id = o.id AND s.user_id = CAST(:userId AS uuid)
                LEFT JOIN user_lesson_state previous
                  ON previous.lesson_id = o.predecessor_id AND previous.user_id = CAST(:userId AS uuid)
            )
            """;

    private final EntityManager entityManager;

    public JpaLearnerCourseQueryRepository(EntityManager entityManager) {
        this.entityManager = entityManager;
    }

    @Override
    @SuppressWarnings("unchecked")
    public List<OverviewUnitView> overviewUnits(UUID userId, UUID courseId) {
        Query query = entityManager.createNativeQuery("""
                SELECT u.id, u.title, u.order_index,
                       count(l.id) AS lesson_count,
                       count(l.id) FILTER (WHERE s.status = 'COMPLETED') AS completed_count,
                       coalesce(avg(s.best_score_percent) FILTER (WHERE s.status = 'COMPLETED'), 0) AS average_score
                FROM unit u
                LEFT JOIN chapter c ON c.unit_id = u.id
                LEFT JOIN lesson l ON l.chapter_id = c.id AND l.status = 'PUBLISHED'
                LEFT JOIN user_lesson_state s
                  ON s.lesson_id = l.id AND s.user_id = CAST(:userId AS uuid)
                WHERE u.course_id = :courseId
                GROUP BY u.id, u.title, u.order_index
                ORDER BY u.order_index, u.id
                """);
        bindUserAndCourse(query, userId, courseId);
        return ((List<Object[]>) query.getResultList()).stream()
                .map(row -> new OverviewUnitView(uuid(row[0]), (String) row[1], number(row[2]).intValue(),
                        number(row[3]).longValue(), number(row[4]).longValue(), number(row[5]).doubleValue()))
                .toList();
    }

    @Override
    @SuppressWarnings("unchecked")
    public List<OverviewChapterView> overviewChapters(UUID userId, UUID courseId) {
        Query query = entityManager.createNativeQuery("""
                SELECT c.id, c.unit_id, c.title, c.order_index,
                       count(l.id) AS lesson_count,
                       count(l.id) FILTER (WHERE s.status = 'COMPLETED') AS completed_count
                FROM chapter c
                JOIN unit u ON u.id = c.unit_id
                LEFT JOIN lesson l ON l.chapter_id = c.id AND l.status = 'PUBLISHED'
                LEFT JOIN user_lesson_state s
                  ON s.lesson_id = l.id AND s.user_id = CAST(:userId AS uuid)
                WHERE u.course_id = :courseId
                GROUP BY c.id, c.unit_id, c.title, c.order_index, u.order_index
                ORDER BY u.order_index, c.order_index, c.id
                """);
        bindUserAndCourse(query, userId, courseId);
        return ((List<Object[]>) query.getResultList()).stream()
                .map(row -> new OverviewChapterView(uuid(row[0]), uuid(row[1]), (String) row[2],
                        number(row[3]).intValue(), number(row[4]).longValue(), number(row[5]).longValue()))
                .toList();
    }

    @Override
    @SuppressWarnings("unchecked")
    public ChapterLessonPage chapterLessons(UUID userId, UUID courseId, UUID chapterId, int page, int size) {
        if (!chapterBelongsToCourse(courseId, chapterId)) {
            return ChapterLessonPage.chapterNotFound();
        }
        Query countQuery = entityManager.createNativeQuery("""
                SELECT count(*) FROM lesson l
                WHERE l.chapter_id = :chapterId AND l.status = 'PUBLISHED'
                """);
        countQuery.setParameter("chapterId", chapterId);
        long total = number(countQuery.getSingleResult()).longValue();

        Query query = entityManager.createNativeQuery(ORDERED_LESSONS_CTE + """
                SELECT a.id, a.chapter_id, a.title, a.progress_status, a.best_score_percent,
                       a.sequentially_locked AS locked
                FROM decisions a
                WHERE a.chapter_id = :chapterId
                ORDER BY a.lesson_order, a.id
                LIMIT :size OFFSET :offset
                """);
        bindDecisionParameters(query, userId, courseId);
        query.setParameter("chapterId", chapterId);
        query.setParameter("size", size);
        query.setParameter("offset", page * size);
        List<LessonSummaryView> items = ((List<Object[]>) query.getResultList()).stream()
                .map(this::lessonSummary)
                .toList();
        return new ChapterLessonPage(items, total);
    }

    @Override
    @SuppressWarnings("unchecked")
    public Optional<LessonSummaryView> nextLesson(UUID userId, UUID courseId) {
        Query query = entityManager.createNativeQuery(ORDERED_LESSONS_CTE + """
                SELECT a.id, a.chapter_id, a.title, a.progress_status, a.best_score_percent,
                       false AS locked
                FROM decisions a
                WHERE a.progress_status <> 'COMPLETED'
                  AND NOT a.sequentially_locked
                ORDER BY a.unit_order, a.chapter_order, a.lesson_order, a.id
                LIMIT 1
                """);
        bindDecisionParameters(query, userId, courseId);
        List<Object[]> rows = query.getResultList();
        return rows.stream().findFirst().map(this::lessonSummary);
    }

    @Override
    @SuppressWarnings("unchecked")
    public Optional<LessonAccessView> lessonAccess(UUID userId, UUID lessonId) {
        Query courseQuery = entityManager.createNativeQuery("""
                SELECT u.course_id
                FROM lesson l
                JOIN chapter c ON c.id = l.chapter_id
                JOIN unit u ON u.id = c.unit_id
                JOIN course course ON course.id = u.course_id AND course.status = 'PUBLISHED'
                WHERE l.id = :lessonId AND l.status = 'PUBLISHED'
                """);
        courseQuery.setParameter("lessonId", lessonId);
        List<Object> courses = courseQuery.getResultList();
        if (courses.isEmpty()) {
            return Optional.empty();
        }
        UUID courseId = uuid(courses.getFirst());
        Query query = entityManager.createNativeQuery(ORDERED_LESSONS_CTE + """
                SELECT NOT a.sequentially_locked AS unlocked
                FROM decisions a
                WHERE a.id = :lessonId
                """);
        bindDecisionParameters(query, userId, courseId);
        query.setParameter("lessonId", lessonId);
        List<Object> rows = query.getResultList();
        return rows.stream().findFirst()
                .map(value -> new LessonAccessView(courseId, Boolean.TRUE.equals(value), false));
    }

    private boolean chapterBelongsToCourse(UUID courseId, UUID chapterId) {
        Query query = entityManager.createNativeQuery("""
                SELECT EXISTS (
                    SELECT 1 FROM chapter c
                    JOIN unit u ON u.id = c.unit_id
                    WHERE c.id = :chapterId AND u.course_id = :courseId)
                """);
        query.setParameter("chapterId", chapterId);
        query.setParameter("courseId", courseId);
        return Boolean.TRUE.equals(query.getSingleResult());
    }

    private LessonSummaryView lessonSummary(Object[] row) {
        return new LessonSummaryView(uuid(row[0]), uuid(row[1]), (String) row[2],
                (String) row[3], row[4] == null ? null : number(row[4]).shortValue(),
                Boolean.TRUE.equals(row[5]), false);
    }

    private void bindUserAndCourse(Query query, UUID userId, UUID courseId) {
        query.setParameter("userId", userId == null ? null : userId.toString());
        query.setParameter("courseId", courseId);
    }

    private void bindDecisionParameters(Query query, UUID userId, UUID courseId) {
        bindUserAndCourse(query, userId, courseId);
    }

    private static UUID uuid(Object value) {
        return value instanceof UUID id ? id : UUID.fromString(value.toString());
    }

    private static Number number(Object value) {
        return (Number) value;
    }
}
