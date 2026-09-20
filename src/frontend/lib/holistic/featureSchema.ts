/**
 * Schema đặc trưng `v2_holistic_subset` — 64 khung × 327 chiều.
 *
 * ⚠️ HỢP ĐỒNG DÙNG CHUNG BA NƠI. Mỗi con số ở đây phải khớp tuyệt đối với:
 *   - `src/ai/app/schema.py`            (dịch vụ AI — nơi mô hình đọc tensor)
 *   - `FeatureSchema.java`              (backend — nơi kiểm kích thước ở biên)
 *
 * Lệch bố cục thì mô hình nhận rác mà không báo lỗi — đây chính là rủi ro T-11, nên khi đổi phải đổi
 * cả ba và chạy lại bộ test chung (AC-44.2).
 */

export const SCHEMA_VERSION = "v2_holistic_subset";
export const SEQUENCE_LENGTH = 64;
export const FEATURE_DIM = 327;

/** Số khung hữu ích chấp nhận được cho một lượt (FR-42). */
export const MIN_USEFUL_FRAMES = 8;
export const MAX_USEFUL_FRAMES = 32;

/** Tự dừng ghi ở 5 giây để tránh chuỗi quá dài (BR-A119). */
export const MAX_RECORDING_MS = 5000;

/** Nhịp lấy mẫu mục tiêu: 16 khung/giây × 2 giây = 32 khung — đúng nhịp mong đợi của một ký hiệu. */
export const TARGET_SAMPLE_FPS = 16;

export const SLICES = {
  leftHand: [0, 63],
  rightHand: [63, 126],
  pose: [126, 162],
  face: [162, 285],
  motion: [285, 303],
  geometry: [303, 319],
  quality: [319, 327],
} as const;

/** MediaPipe Pose: mũi, hai vai, hai khuỷu, hai cổ tay, hai hông. */
export const POSE_LANDMARK_INDICES = [0, 11, 12, 13, 14, 15, 16, 23, 24];

/**
 * 41 điểm Face Mesh: viền mặt, hai mắt, hai chân mày, sống mũi, miệng.
 * Ký hiệu VSL dùng nét mặt làm ngữ pháp nên không thể bỏ hẳn lát này.
 */
export const FACE_LANDMARK_INDICES = [
  10, 152, 234, 454, 162, 389,
  33, 133, 159, 145, 157, 154,
  362, 263, 386, 374, 384, 381,
  70, 63, 105, 107,
  300, 293, 334, 336,
  1, 4, 5, 195, 197,
  61, 291, 13, 14, 78, 308, 0, 17, 37, 267,
];

/** Thứ tự cố định của 8 chiều trong lát `quality`. */
export const QUALITY_FIELDS = [
  "leftHandPresent",
  "rightHandPresent",
  "poseDetected",
  "faceDetected",
  "handFrameRatio",
  "bothHandsRatio",
  "frameIndexNorm",
  "normScale",
] as const;

/** Giá trị tuyệt đối tối đa của một phần tử tensor (api-spec §3.12c). */
export const MAX_ABS_VALUE = 50;

// Kiểm tại thời điểm nạp module: sai bố cục thì phải vỡ ngay, không âm thầm gửi tensor hỏng.
if (POSE_LANDMARK_INDICES.length * 4 !== 36) throw new Error("Lát pose phải đúng 36 chiều");
if (FACE_LANDMARK_INDICES.length * 3 !== 123) throw new Error("Lát face phải đúng 123 chiều");
if (QUALITY_FIELDS.length !== 8) throw new Error("Lát quality phải đúng 8 chiều");
if (SLICES.quality[1] !== FEATURE_DIM) throw new Error("Tổng số chiều phải là 327");
