package vn.duy.signlight.identity.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Tuỳ chọn học tập. Đổi khoá <b>không</b> làm mất tiến độ (BR-A15). */
@Entity
@Table(name = "user_preference")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserPreference {

    @Id
    @Column(name = "user_id")
    private UUID userId;

    @Column(name = "active_course_id")
    private UUID activeCourseId;

    @Column(name = "daily_goal_minutes", nullable = false)
    private short dailyGoalMinutes;

    /** Mục tiêu mới chỉ có hiệu lực từ ngày mai — chống hạ mục tiêu để cứu streak (BR-A52). */
    @Column(name = "pending_goal_minutes")
    private Short pendingGoalMinutes;

    @Column(name = "learning_reason", length = 20)
    private String learningReason;

    @Column(name = "ui_locale", nullable = false, length = 10)
    private String uiLocale;

    @Column(name = "video_speed", nullable = false)
    private BigDecimal videoSpeed;

    @Column(name = "marketing_email_opt_in", nullable = false)
    private boolean marketingEmailOptIn;
}
