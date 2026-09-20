package vn.duy.signlight.airecognition.application;

import java.util.List;
import java.util.Map;

/**
 * Hằng số của schema đặc trưng {@code v2_holistic_subset}.
 *
 * <p>Phải khớp từng con số với {@code src/ai/app/schema.py} và
 * {@code src/frontend/lib/holistic/featureSchema.ts}. Backend không trích đặc trưng, nhưng phải biết
 * kích thước để từ chối tensor sai ngay ở biên (mã {@code 10102}) thay vì đẩy rác sang dịch vụ AI.
 */
public final class FeatureSchema {

    public static final String SCHEMA_VERSION = "v2_holistic_subset";
    public static final int SEQUENCE_LENGTH = 64;
    public static final int FEATURE_DIM = 327;

    /** Số khung hữu ích chấp nhận được cho một lượt ký hiệu (FR-42, mã 10104). */
    public static final int MIN_FRAMES = 8;
    public static final int MAX_FRAMES = 32;

    /** Giá trị tuyệt đối tối đa của một phần tử tensor (api-spec §3.12c). */
    public static final float MAX_ABS_VALUE = 50.0f;

    public static final List<Integer> POSE_LANDMARK_INDICES =
            List.of(0, 11, 12, 13, 14, 15, 16, 23, 24);

    public static final Map<String, List<Integer>> SLICES = Map.of(
            "leftHand", List.of(0, 63),
            "rightHand", List.of(63, 126),
            "pose", List.of(126, 162),
            "face", List.of(162, 285),
            "motion", List.of(285, 303),
            "geometry", List.of(303, 319),
            "quality", List.of(319, 327));

    /** Ghi nguồn bắt buộc hiển thị trong sản phẩm — giấy phép CC BY 4.0 của VSL400 (SC-12, T-12). */
    public static final String ATTRIBUTION_TEXT =
            "Dữ liệu huấn luyện: VSL400 (Zenodo) — giấy phép CC BY 4.0";

    /** Tuyên bố bắt buộc trên màn luyện AI (BR-A116, SC-13). */
    public static final String DISCLAIMER_TEXT =
            "Đây là công cụ hỗ trợ luyện tập, không phải thông dịch viên.";

    private FeatureSchema() {
    }
}
