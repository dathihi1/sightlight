package vn.duy.signlight.learning.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Bài học được mở khóa riêng lẻ bởi người dùng (bằng EXP hoặc PayOS: thuê 1 tháng hoặc vĩnh viễn).
 */
@Entity
@Table(name = "user_unlocked_lesson")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserUnlockedLesson {

    public static final String TYPE_RENT_1M = "RENT_1M";
    public static final String TYPE_PERMANENT = "PERMANENT";

    public static final String PAID_VND = "VND";
    public static final String PAID_EXP = "EXP";

    @Id
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "lesson_id", nullable = false)
    private UUID lessonId;

    @Column(name = "unlock_type", nullable = false, length = 20)
    private String unlockType;

    @Column(name = "paid_by", nullable = false, length = 20)
    private String paidBy;

    @Column(nullable = false)
    private int amount;

    @Column(name = "expires_at")
    private Instant expiresAt;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    public boolean isValid() {
        return expiresAt == null || expiresAt.isAfter(Instant.now());
    }
}
