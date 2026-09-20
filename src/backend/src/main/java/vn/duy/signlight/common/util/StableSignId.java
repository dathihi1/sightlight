package vn.duy.signlight.common.util;

import java.text.Normalizer;
import java.util.regex.Pattern;

/**
 * Chuẩn hoá nhãn của mô hình AI thành khoá ổn định (BR-A124).
 *
 * <p><b>Phải giống hệt</b> {@code stable_sign_id()} trong {@code src/ai/app/labels.py}. Lệch một ký tự
 * là nhãn thành mồ côi và người học nhận kết quả vô nghĩa — đây chính là rủi ro T-11, nên có test
 * dùng chung bộ dữ liệu ở cả hai phía (AC-44.2).
 *
 * <p>{@code Cái bàn} → {@code cai-ban}; {@code Quạt (đứng)} → {@code quat-dung}.
 */
public final class StableSignId {

    private static final Pattern NON_ALNUM = Pattern.compile("[^a-z0-9]+");
    private static final Pattern COMBINING = Pattern.compile("\\p{M}+");

    private StableSignId() {
    }

    public static String of(String rawLabel) {
        if (rawLabel == null) {
            return "";
        }
        // `đ` không tách được dấu gạch bằng NFKD nên phải thay tay trước khi chuẩn hoá.
        String text = rawLabel.replace("đ", "d").replace("Đ", "D");
        text = Normalizer.normalize(text, Normalizer.Form.NFKD);
        text = COMBINING.matcher(text).replaceAll("");
        text = text.toLowerCase(java.util.Locale.ROOT);
        text = NON_ALNUM.matcher(text).replaceAll("-");
        return trimDashes(text);
    }

    private static String trimDashes(String value) {
        int start = 0;
        int end = value.length();
        while (start < end && value.charAt(start) == '-') {
            start++;
        }
        while (end > start && value.charAt(end - 1) == '-') {
            end--;
        }
        return value.substring(start, end);
    }
}
