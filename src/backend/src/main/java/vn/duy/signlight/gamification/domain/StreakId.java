package vn.duy.signlight.gamification.domain;

import java.io.Serializable;
import java.util.Objects;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Streak tính **theo khoá học**, không phải theo tài khoản. */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class StreakId implements Serializable {

    private UUID userId;
    private UUID courseId;

    @Override
    public boolean equals(Object other) {
        if (this == other) {
            return true;
        }
        if (!(other instanceof StreakId that)) {
            return false;
        }
        return Objects.equals(userId, that.userId) && Objects.equals(courseId, that.courseId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(userId, courseId);
    }
}
