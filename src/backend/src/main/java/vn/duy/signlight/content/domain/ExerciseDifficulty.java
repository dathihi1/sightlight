package vn.duy.signlight.content.domain;

/**
 * Mức độ khó của bài tập.
 *
 * <p>Giúp:
 * <ul>
 *   <li>Sắp xếp bài tập theo độ khó tăng dần</li>
 *   <li>Điều chỉnh adaptive learning</li>
 *   <li>Phân tích nơi người học gặp khó khăn</li>
 * </ul>
 */
public final class ExerciseDifficulty {

    /** Bài tập giới thiệu, dễ nhất */
    public static final String INTRO = "INTRO";

    /** Bài tập cơ bản */
    public static final String BASIC = "BASIC";

    /** Bài tập trung bình */
    public static final String INTERMEDIATE = "INTERMEDIATE";

    /** Bài tập thách thức */
    public static final String CHALLENGE = "CHALLENGE";

    private ExerciseDifficulty() {
        throw new UnsupportedOperationException("Utility class");
    }

    public static boolean isValid(String difficulty) {
        return INTRO.equals(difficulty)
            || BASIC.equals(difficulty)
            || INTERMEDIATE.equals(difficulty)
            || CHALLENGE.equals(difficulty);
    }
}
