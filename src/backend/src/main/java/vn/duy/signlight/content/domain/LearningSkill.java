package vn.duy.signlight.content.domain;

/**
 * Kỹ năng học tập mà bài tập hướng đến.
 *
 * <p>Phân loại bài tập theo kỹ năng giúp:
 * <ul>
 *   <li>Phân tích hiệu quả phương pháp học</li>
 *   <li>Cân bằng các loại kỹ năng trong lesson</li>
 *   <li>Tạo lộ trình học phù hợp với từng người</li>
 * </ul>
 */
public final class LearningSkill {

    /** Nhận diện ký hiệu → nghĩa (receptive skill) */
    public static final String RECOGNITION = "RECOGNITION";

    /** Nhớ lại nghĩa mà không có gợi ý (recall without cues) */
    public static final String RECALL = "RECALL";

    /** Tạo ra ký hiệu (productive skill, e.g., camera practice) */
    public static final String PRODUCTION = "PRODUCTION";

    /** Sắp xếp thứ tự đúng */
    public static final String ORDERING = "ORDERING";

    /** Hiểu ngữ cảnh và tình huống sử dụng */
    public static final String COMPREHENSION = "COMPREHENSION";

    /** Phân biệt các ký hiệu tương tự */
    public static final String DISCRIMINATION = "DISCRIMINATION";

    private LearningSkill() {
        throw new UnsupportedOperationException("Utility class");
    }

    public static boolean isValid(String skill) {
        return RECOGNITION.equals(skill)
            || RECALL.equals(skill)
            || PRODUCTION.equals(skill)
            || ORDERING.equals(skill)
            || COMPREHENSION.equals(skill)
            || DISCRIMINATION.equals(skill);
    }
}
