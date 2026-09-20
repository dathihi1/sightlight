package vn.duy.signlight.gamification.domain;

import java.io.Serializable;
import java.time.LocalDate;
import java.util.Objects;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Khoá ba thành phần: người dùng × khoá học × ngày địa phương. */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DailyActivityId implements Serializable {

    private UUID userId;
    private UUID courseId;
    private LocalDate activityDateLocal;

    @Override
    public boolean equals(Object other) {
        if (this == other) {
            return true;
        }
        if (!(other instanceof DailyActivityId that)) {
            return false;
        }
        return Objects.equals(userId, that.userId)
                && Objects.equals(courseId, that.courseId)
                && Objects.equals(activityDateLocal, that.activityDateLocal);
    }

    @Override
    public int hashCode() {
        return Objects.hash(userId, courseId, activityDateLocal);
    }
}
