package vn.duy.signlight.content.application;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.duy.signlight.common.error.BusinessException;
import vn.duy.signlight.common.error.ErrorCode;
import vn.duy.signlight.content.domain.Course;
import vn.duy.signlight.content.repository.CourseRepository;

/**
 * Cổng vào của module `content` cho các feature khác.
 *
 * <p>Feature khác (identity, learning, airecognition) gọi service này thay vì đụng thẳng repository
 * của `content` — quy tắc phụ thuộc ở `package-structure.md` §2.
 */
@Service
public class ContentCatalogService {

    public static final String STATUS_PUBLISHED = "PUBLISHED";

    private final CourseRepository courseRepository;

    public ContentCatalogService(CourseRepository courseRepository) {
        this.courseRepository = courseRepository;
    }

    @Transactional(readOnly = true)
    public List<Course> publishedCourses() {
        return courseRepository.findByStatusOrderByCodeAsc(STATUS_PUBLISHED);
    }

    /** Khoá gán mặc định khi đăng ký mà onboarding chưa chọn khoá nào (FR-05). */
    @Transactional(readOnly = true)
    public Optional<UUID> defaultCourseId() {
        return publishedCourses().stream().findFirst().map(Course::getId);
    }

    @Transactional(readOnly = true)
    public Course requirePublishedCourse(UUID courseId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND));
        if (!STATUS_PUBLISHED.equals(course.getStatus())) {
            throw new BusinessException(ErrorCode.CONTENT_NOT_PUBLISHED);
        }
        return course;
    }
}
