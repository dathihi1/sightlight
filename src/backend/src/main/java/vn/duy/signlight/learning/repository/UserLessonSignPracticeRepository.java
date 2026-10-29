package vn.duy.signlight.learning.repository;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import vn.duy.signlight.learning.domain.UserLessonSignPractice;
import vn.duy.signlight.learning.domain.UserLessonSignPracticeId;

public interface UserLessonSignPracticeRepository
        extends JpaRepository<UserLessonSignPractice, UserLessonSignPracticeId> {

    List<UserLessonSignPractice> findByUserIdAndLessonId(UUID userId, UUID lessonId);

    boolean existsByUserIdAndLessonIdAndSignId(UUID userId, UUID lessonId, UUID signId);
}
