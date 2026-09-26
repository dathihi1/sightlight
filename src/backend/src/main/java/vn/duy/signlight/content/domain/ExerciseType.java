package vn.duy.signlight.content.domain;

/**
 * Các loại bài tập được hỗ trợ.
 *
 * <p>Hiện tại hỗ trợ 3 loại cơ bản:
 * <ul>
 *   <li>SIGN_TO_MEANING: Xem video ký hiệu, chọn nghĩa đúng</li>
 *   <li>MEANING_TO_SIGN: Đọc nghĩa, chọn video ký hiệu đúng</li>
 *   <li>TYPE_WHAT_YOU_SEE: Xem video, nhập nghĩa</li>
 *   <li>SENTENCE_ORDER: Sắp xếp các từ theo thứ tự đúng</li>
 * </ul>
 *
 * <p>Các loại mới sẽ được thêm trong tương lai:
 * <ul>
 *   <li>SIGN_VIDEO_RECALL: Xem video, nhập hoặc chọn nghĩa</li>
 *   <li>MATCH_SIGN_MEANING: Ghép nhiều ký hiệu với nhiều nghĩa</li>
 *   <li>TRUE_FALSE_SIGN: Xác định mô tả đúng/sai</li>
 *   <li>DIALOGUE_CHOICE: Chọn câu trả lời phù hợp trong hội thoại</li>
 * </ul>
 */
public final class ExerciseType {

    // Existing types
    public static final String SIGN_TO_MEANING = "SIGN_TO_MEANING";
    public static final String MEANING_TO_SIGN = "MEANING_TO_SIGN";
    public static final String TYPE_WHAT_YOU_SEE = "TYPE_WHAT_YOU_SEE";
    public static final String SENTENCE_ORDER = "SENTENCE_ORDER";

    // New types for future implementation
    public static final String SIGN_VIDEO_RECALL = "SIGN_VIDEO_RECALL";
    public static final String MATCH_SIGN_MEANING = "MATCH_SIGN_MEANING";
    public static final String TRUE_FALSE_SIGN = "TRUE_FALSE_SIGN";
    public static final String DIALOGUE_CHOICE = "DIALOGUE_CHOICE";

    private ExerciseType() {
        throw new UnsupportedOperationException("Utility class");
    }

    /**
     * Kiểm tra xem exercise type có hợp lệ không.
     */
    public static boolean isValid(String type) {
        return SIGN_TO_MEANING.equals(type)
            || MEANING_TO_SIGN.equals(type)
            || TYPE_WHAT_YOU_SEE.equals(type)
            || SENTENCE_ORDER.equals(type)
            || SIGN_VIDEO_RECALL.equals(type)
            || MATCH_SIGN_MEANING.equals(type)
            || TRUE_FALSE_SIGN.equals(type)
            || DIALOGUE_CHOICE.equals(type);
    }

    /**
     * Kiểm tra xem exercise type có được hỗ trợ hiện tại không.
     */
    public static boolean isSupported(String type) {
        return SIGN_TO_MEANING.equals(type)
            || MEANING_TO_SIGN.equals(type)
            || TYPE_WHAT_YOU_SEE.equals(type)
            || SENTENCE_ORDER.equals(type);
    }
}
