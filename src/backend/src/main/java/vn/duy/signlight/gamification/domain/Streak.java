package vn.duy.signlight.gamification.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;
import java.time.LocalDate;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Chuỗi ngày đạt mục tiêu. `longestCount` **chỉ tăng** (BR-A49). */
@Entity
@Table(name = "streak")
@IdClass(StreakId.class)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Streak {

    @Id
    @Column(name = "user_id")
    private UUID userId;

    @Id
    @Column(name = "course_id")
    private UUID courseId;

    @Column(name = "current_count", nullable = false)
    private int currentCount;

    @Column(name = "longest_count", nullable = false)
    private int longestCount;

    @Column(name = "freeze_count", nullable = false)
    private short freezeCount;

    @Column(name = "last_goal_met_date_local")
    private LocalDate lastGoalMetDateLocal;
}
