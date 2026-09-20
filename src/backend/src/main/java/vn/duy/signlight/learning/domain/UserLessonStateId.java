package vn.duy.signlight.learning.domain;

import java.io.Serializable;
import java.util.Objects;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Khoá kép (user_id, lesson_id). */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UserLessonStateId implements Serializable {

    private UUID userId;
    private UUID lessonId;

    @Override
    public boolean equals(Object other) {
        if (this == other) {
            return true;
        }
        if (!(other instanceof UserLessonStateId that)) {
            return false;
        }
        return Objects.equals(userId, that.userId) && Objects.equals(lessonId, that.lessonId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(userId, lessonId);
    }
}
