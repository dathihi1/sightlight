package vn.duy.signlight.learning.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import vn.duy.signlight.learning.domain.UserLessonState;
import vn.duy.signlight.learning.domain.UserLessonStateId;

public interface UserLessonStateRepository
        extends JpaRepository<UserLessonState, UserLessonStateId> {

    List<UserLessonState> findByUserId(UUID userId);

    Optional<UserLessonState> findByUserIdAndLessonId(UUID userId, UUID lessonId);
}
