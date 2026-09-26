package vn.duy.signlight.content.domain;

/**
 * Loại bài học.
 *
 * <p>Các loại bài học hiện có (theo V1__core_schema.sql):
 * <ul>
 *   <li>STANDARD: Bài học tiêu chuẩn với luyện tập</li>
 *   <li>QUIZ: Bài kiểm tra</li>
 *   <li>MILESTONE: Bài đánh dấu cột mốc</li>
 *   <li>DIALOGUE: Bài hội thoại</li>
 * </ul>
 *
 * <p>Trong seed hiện tại, tất cả lesson đều là PRACTICE (cần mapping sang STANDARD).
 */
public final class LessonType {

    public static final String STANDARD = "STANDARD";
    public static final String QUIZ = "QUIZ";
    public static final String MILESTONE = "MILESTONE";
    public static final String DIALOGUE = "DIALOGUE";

    // Alias for backward compatibility with seed
    public static final String PRACTICE = "PRACTICE";

    private LessonType() {
        throw new UnsupportedOperationException("Utility class");
    }

    public static boolean isValid(String type) {
        return STANDARD.equals(type)
            || QUIZ.equals(type)
            || MILESTONE.equals(type)
            || DIALOGUE.equals(type)
            || PRACTICE.equals(type);
    }

    /**
     * Map PRACTICE từ seed sang STANDARD trong database.
     */
    public static String normalize(String type) {
        return PRACTICE.equals(type) ? STANDARD : type;
    }
}
