package vn.duy.signlight.content.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import vn.duy.signlight.content.domain.Course;

public interface CourseRepository extends JpaRepository<Course, UUID> {

    List<Course> findByStatusOrderByCodeAsc(String status);

    Optional<Course> findByCode(String code);

    @Query("""
            select c from Course c
            where (:search is null or lower(c.name) like lower(concat('%', :search, '%'))
                   or lower(c.code) like lower(concat('%', :search, '%')))
              and (:status is null or c.status = :status)
            """)
    Page<Course> adminSearch(
            @Param("search") String search,
            @Param("status") String status,
            Pageable pageable);
}
