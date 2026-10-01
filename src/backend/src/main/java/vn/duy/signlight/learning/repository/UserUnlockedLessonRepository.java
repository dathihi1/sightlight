package vn.duy.signlight.learning.repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import vn.duy.signlight.learning.domain.UserUnlockedLesson;

public interface UserUnlockedLessonRepository extends JpaRepository<UserUnlockedLesson, UUID> {

    Optional<UserUnlockedLesson> findByUserIdAndLessonId(UUID userId, UUID lessonId);

    List<UserUnlockedLesson> findByUserId(UUID userId);

    @Query("SELECT u FROM UserUnlockedLesson u WHERE u.userId = :userId AND u.lessonId = :lessonId AND (u.expiresAt IS NULL OR u.expiresAt > :now)")
    Optional<UserUnlockedLesson> findActiveUnlock(
            @Param("userId") UUID userId,
            @Param("lessonId") UUID lessonId,
            @Param("now") Instant now);

    @Query("SELECT u FROM UserUnlockedLesson u WHERE u.userId = :userId AND (u.expiresAt IS NULL OR u.expiresAt > :now)")
    List<UserUnlockedLesson> findAllActiveUnlocks(
            @Param("userId") UUID userId,
            @Param("now") Instant now);
}
