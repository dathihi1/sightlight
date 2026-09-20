package vn.duy.signlight.content.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import vn.duy.signlight.content.domain.Course;

public interface CourseRepository extends JpaRepository<Course, UUID> {

    List<Course> findByStatusOrderByCodeAsc(String status);

    Optional<Course> findByCode(String code);
}
