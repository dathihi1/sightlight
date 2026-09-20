package vn.duy.signlight.airecognition.domain;

import java.io.Serializable;
import java.time.LocalDate;
import java.util.Objects;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Hạn mức đếm theo **ngày địa phương của người học**, không theo ngày máy chủ. */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AiDailyQuotaId implements Serializable {

    private UUID userId;
    private LocalDate quotaDateLocal;

    @Override
    public boolean equals(Object other) {
        if (this == other) {
            return true;
        }
        if (!(other instanceof AiDailyQuotaId that)) {
            return false;
        }
        return Objects.equals(userId, that.userId)
                && Objects.equals(quotaDateLocal, that.quotaDateLocal);
    }

    @Override
    public int hashCode() {
        return Objects.hash(userId, quotaDateLocal);
    }
}
