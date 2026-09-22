package vn.duy.signlight.identity.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import vn.duy.signlight.identity.domain.EmailVerificationToken;

public interface EmailVerificationTokenRepository
        extends JpaRepository<EmailVerificationToken, UUID> {

    Optional<EmailVerificationToken> findByTokenHashAndUsedAtIsNull(String tokenHash);

    List<EmailVerificationToken> findByUserIdAndUsedAtIsNull(UUID userId);

    /** Tim OTP gan nhat chua dung cua user (de kiem tra rate limit). Spring Data derived query. */
    Optional<EmailVerificationToken> findFirstByUserIdOrderByCreatedAtDesc(UUID userId);

    /** Vo hieu tat ca OTP chua dung cua mot user. */
    @Modifying
    @Query("UPDATE EmailVerificationToken t SET t.usedAt = CURRENT_TIMESTAMP "
            + "WHERE t.userId = :userId AND t.usedAt IS NULL")
    void invalidateAllForUser(UUID userId);
}
