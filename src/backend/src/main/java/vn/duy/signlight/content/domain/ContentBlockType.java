package vn.duy.signlight.content.domain;

/**
 * Các loại khối nội dung trong bài học.
 *
 * <p>Mỗi loại block có cách render và dữ liệu riêng:
 * <ul>
 *   <li>INTRO: Giới thiệu bài học</li>
 *   <li>OBJECTIVES: Mục tiêu học tập</li>
 *   <li>CONTEXT: Ngữ cảnh sử dụng</li>
 *   <li>SIGN_CARD: Chi tiết về một ký hiệu cụ thể</li>
 *   <li>PRONUNCIATION_NOTE: Hướng dẫn phát âm/chuyển động</li>
 *   <li>MEMORY_TIP: Mẹo ghi nhớ</li>
 *   <li>EXAMPLE: Ví dụ câu</li>
 *   <li>DIALOGUE: Hội thoại mẫu</li>
 *   <li>VIDEO: Video minh họa độc lập</li>
 *   <li>CHECKPOINT: Kiểm tra giữa bài</li>
 *   <li>SUMMARY: Tóm tắt bài học</li>
 * </ul>
 */
public final class ContentBlockType {

    /** Giới thiệu bài học */
    public static final String INTRO = "INTRO";

    /** Danh sách mục tiêu học tập */
    public static final String OBJECTIVES = "OBJECTIVES";

    /** Ngữ cảnh hoặc tình huống sử dụng */
    public static final String CONTEXT = "CONTEXT";

    /** Thông tin chi tiết về một ký hiệu */
    public static final String SIGN_CARD = "SIGN_CARD";

    /** Hướng dẫn phát âm/chuyển động */
    public static final String PRONUNCIATION_NOTE = "PRONUNCIATION_NOTE";

    /** Mẹo ghi nhớ */
    public static final String MEMORY_TIP = "MEMORY_TIP";

    /** Ví dụ câu hoặc cách dùng */
    public static final String EXAMPLE = "EXAMPLE";

    /** Hội thoại mẫu */
    public static final String DIALOGUE = "DIALOGUE";

    /** Video minh họa */
    public static final String VIDEO = "VIDEO";

    /** Câu hỏi kiểm tra giữa bài */
    public static final String CHECKPOINT = "CHECKPOINT";

    /** Tóm tắt và điểm chính */
    public static final String SUMMARY = "SUMMARY";

    private ContentBlockType() {
        throw new UnsupportedOperationException("Utility class");
    }

    public static boolean isValid(String type) {
        return INTRO.equals(type)
            || OBJECTIVES.equals(type)
            || CONTEXT.equals(type)
            || SIGN_CARD.equals(type)
            || PRONUNCIATION_NOTE.equals(type)
            || MEMORY_TIP.equals(type)
            || EXAMPLE.equals(type)
            || DIALOGUE.equals(type)
            || VIDEO.equals(type)
            || CHECKPOINT.equals(type)
            || SUMMARY.equals(type);
    }
}
