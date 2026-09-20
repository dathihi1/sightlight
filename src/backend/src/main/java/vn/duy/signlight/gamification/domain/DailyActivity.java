package vn.duy.signlight.gamification.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Hoạt động theo ngày địa phương của người học.
 *
 * <p>`goalMinutes` được **chụp lại** tại thời điểm ghi nhận, để hạ mục tiêu giữa chừng không cứu được
 * streak (BR-A52).
 */
@Entity
@Table(name = "daily_activity")
@IdClass(DailyActivityId.class)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DailyActivity {

    @Id
    @Column(name = "user_id")
    private UUID userId;

    @Id
    @Column(name = "course_id")
    private UUID courseId;

    @Id
    @Column(name = "activity_date_local")
    private LocalDate activityDateLocal;

    @Column(name = "total_minutes", nullable = false)
    private BigDecimal totalMinutes;

    @Column(name = "goal_minutes", nullable = false)
    private short goalMinutes;

    @Column(name = "goal_met", nullable = false)
    private boolean goalMet;
}
