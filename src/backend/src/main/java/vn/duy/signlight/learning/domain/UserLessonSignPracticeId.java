package vn.duy.signlight.learning.domain;

import java.io.Serializable;
import java.util.Objects;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Khóa của một bài luyện từ vựng nằm trước lesson chính. */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UserLessonSignPracticeId implements Serializable {

    private UUID userId;
    private UUID lessonId;
    private UUID signId;

    @Override
    public boolean equals(Object other) {
        if (this == other) {
            return true;
        }
        if (!(other instanceof UserLessonSignPracticeId that)) {
            return false;
        }
        return Objects.equals(userId, that.userId)
                && Objects.equals(lessonId, that.lessonId)
                && Objects.equals(signId, that.signId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(userId, lessonId, signId);
    }
}
