/**
 * Trích đặc trưng chuyển động **ngay trong trình duyệt** (Q8 — phương án B, NFR-12).
 *
 * Không một pixel nào rời khỏi thiết bị: đầu ra duy nhất của file này là một tensor số 64×327 cộng
 * vài chỉ số chất lượng. Không ghi hình, không tải lên, không lưu.
 */

import {
  FilesetResolver,
  HolisticLandmarker,
  type HolisticLandmarkerResult,
  type NormalizedLandmark,
} from "@mediapipe/tasks-vision";

import {
  FACE_LANDMARK_INDICES,
  FEATURE_DIM,
  MAX_ABS_VALUE,
  MAX_USEFUL_FRAMES,
  POSE_LANDMARK_INDICES,
  SEQUENCE_LENGTH,
  SLICES,
} from "./featureSchema";

const WASM_BASE =
  process.env.NEXT_PUBLIC_MEDIAPIPE_WASM_URL ??
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm";

const MODEL_ASSET =
  process.env.NEXT_PUBLIC_HOLISTIC_MODEL_URL ??
  "https://storage.googleapis.com/mediapipe-models/holistic_landmarker/holistic_landmarker/float16/latest/holistic_landmarker.task";

/** Chỉ số MediaPipe Pose dùng làm điểm neo. */
const POSE = {
  nose: 0,
  leftShoulder: 11,
  rightShoulder: 12,
  leftElbow: 13,
  rightElbow: 14,
  leftWrist: 15,
  rightWrist: 16,
} as const;

/** Chỉ số landmark bàn tay của MediaPipe Hands. */
const HAND = { wrist: 0, indexTip: 8, middleTip: 12, pinkyTip: 20, thumbTip: 4 } as const;

export interface FrameQuality {
  handFrameRatio: number;
  bothHandsRatio: number;
  poseDetected: boolean;
}

export interface ExtractionResult {
  /** Tensor đã chuẩn hoá về đúng 64 × 327. */
  features: number[][];
  /** Số khung **hữu ích** thu được (có ít nhất một bàn tay) — server kiểm 8 ≤ n ≤ 32. */
  frameCount: number;
  durationMs: number;
  quality: FrameQuality;
}

let landmarkerPromise: Promise<HolisticLandmarker> | null = null;

/** Nạp mô hình một lần rồi dùng lại; trình duyệt cache tệp `.task` cho lần sau (NFR-04). */
export async function loadHolisticLandmarker(): Promise<HolisticLandmarker> {
  if (!landmarkerPromise) {
    landmarkerPromise = (async () => {
      const fileset = await FilesetResolver.forVisionTasks(WASM_BASE);
      return HolisticLandmarker.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: MODEL_ASSET, delegate: "GPU" },
        runningMode: "VIDEO",
      });
    })().catch((error) => {
      landmarkerPromise = null; // cho phép thử lại nếu lần nạp này hỏng
      throw error;
    });
  }
  return landmarkerPromise;
}

/**
 * Bộ gom khung của một lượt ghi.
 *
 * Mỗi khung được biến thành một vector 327 chiều ngay lập tức, và ảnh gốc bị bỏ đi — không giữ lại
 * khung hình nào trong bộ nhớ.
 */
export class SignSequenceRecorder {
  private readonly frames: number[][] = [];
  private previousAnchors: number[] | null = null;
  private handFrames = 0;
  private bothHandFrames = 0;
  private poseFrames = 0;
  private processedFrames = 0;
  private startedAt = 0;

  start() {
    this.frames.length = 0;
    this.previousAnchors = null;
    this.handFrames = 0;
    this.bothHandFrames = 0;
    this.poseFrames = 0;
    this.processedFrames = 0;
    this.startedAt = performance.now();
  }

  get usefulFrameCount(): number {
    return this.frames.length;
  }

  get isFull(): boolean {
    return this.frames.length >= MAX_USEFUL_FRAMES;
  }

  /** Nạp một kết quả nhận dạng. Khung không thấy bàn tay nào bị bỏ qua — nó không dạy gì cho mô hình. */
  addFrame(result: HolisticLandmarkerResult) {
    this.processedFrames++;

    const leftHand = firstOrNull(result.leftHandLandmarks);
    const rightHand = firstOrNull(result.rightHandLandmarks);
    const pose = firstOrNull(result.poseLandmarks);
    const face = firstOrNull(result.faceLandmarks);

    const hasAnyHand = Boolean(leftHand || rightHand);
    if (hasAnyHand) this.handFrames++;
    if (leftHand && rightHand) this.bothHandFrames++;
    if (pose) this.poseFrames++;

    if (!hasAnyHand || this.isFull) return;

    const scale = shoulderScale(pose);
    const origin = bodyOrigin(pose);

    const vector = new Array<number>(FEATURE_DIM).fill(0);

    writeHand(vector, SLICES.leftHand[0], leftHand, scale);
    writeHand(vector, SLICES.rightHand[0], rightHand, scale);
    writePose(vector, SLICES.pose[0], pose, origin, scale);
    writeFace(vector, SLICES.face[0], face, scale);

    const anchors = anchorPoints(leftHand, rightHand, pose, origin, scale);
    writeMotion(vector, SLICES.motion[0], anchors, this.previousAnchors);
    this.previousAnchors = anchors;

    writeGeometry(vector, SLICES.geometry[0], leftHand, rightHand, pose, origin, scale);

    const handRatio = this.handFrames / Math.max(this.processedFrames, 1);
    const bothRatio = this.bothHandFrames / Math.max(this.processedFrames, 1);
    writeQuality(vector, SLICES.quality[0], {
      leftHandPresent: leftHand ? 1 : 0,
      rightHandPresent: rightHand ? 1 : 0,
      poseDetected: pose ? 1 : 0,
      faceDetected: face ? 1 : 0,
      handFrameRatio: handRatio,
      bothHandsRatio: bothRatio,
      frameIndexNorm: this.frames.length / MAX_USEFUL_FRAMES,
      normScale: scale,
    });

    this.frames.push(vector.map(clampValue));
  }

  /** Kết thúc lượt: chuẩn hoá chuỗi về đúng 64 khung. */
  finish(): ExtractionResult {
    const durationMs = Math.round(performance.now() - this.startedAt);
    return {
      features: resampleTo(this.frames, SEQUENCE_LENGTH),
      frameCount: this.frames.length,
      durationMs,
      quality: {
        handFrameRatio: round4(this.handFrames / Math.max(this.processedFrames, 1)),
        bothHandsRatio: round4(this.bothHandFrames / Math.max(this.processedFrames, 1)),
        poseDetected: this.poseFrames > this.processedFrames / 2,
      },
    };
  }
}

// ------------------------------------------------------------------ ghi từng lát

function writeHand(target: number[], offset: number, hand: NormalizedLandmark[] | null, scale: number) {
  if (!hand) return; // không thấy tay -> để nguyên số 0, mô hình học được "vắng mặt"
  const wrist = hand[HAND.wrist];
  for (let i = 0; i < 21; i++) {
    const point = hand[i] ?? wrist;
    target[offset + i * 3] = (point.x - wrist.x) / scale;
    target[offset + i * 3 + 1] = (point.y - wrist.y) / scale;
    target[offset + i * 3 + 2] = (point.z - wrist.z) / scale;
  }
}

function writePose(
  target: number[],
  offset: number,
  pose: NormalizedLandmark[] | null,
  origin: { x: number; y: number; z: number },
  scale: number,
) {
  if (!pose) return;
  POSE_LANDMARK_INDICES.forEach((landmarkIndex, slot) => {
    const point = pose[landmarkIndex];
    if (!point) return;
    target[offset + slot * 4] = (point.x - origin.x) / scale;
    target[offset + slot * 4 + 1] = (point.y - origin.y) / scale;
    target[offset + slot * 4 + 2] = (point.z - origin.z) / scale;
    target[offset + slot * 4 + 3] = point.visibility ?? 0;
  });
}

function writeFace(
  target: number[],
  offset: number,
  face: NormalizedLandmark[] | null,
  scale: number,
) {
  if (!face || face.length === 0) return;
  const nose = face[1] ?? face[0];
  FACE_LANDMARK_INDICES.forEach((landmarkIndex, slot) => {
    const point = face[landmarkIndex];
    if (!point) return;
    target[offset + slot * 3] = (point.x - nose.x) / scale;
    target[offset + slot * 3 + 1] = (point.y - nose.y) / scale;
    target[offset + slot * 3 + 2] = (point.z - nose.z) / scale;
  });
}

/** Sáu điểm neo × (x, y, z) — cơ sở tính vận tốc ở lát `motion`. */
function anchorPoints(
  leftHand: NormalizedLandmark[] | null,
  rightHand: NormalizedLandmark[] | null,
  pose: NormalizedLandmark[] | null,
  origin: { x: number; y: number; z: number },
  scale: number,
): number[] {
  const relative = (point: NormalizedLandmark | undefined | null): number[] =>
    point
      ? [(point.x - origin.x) / scale, (point.y - origin.y) / scale, (point.z - origin.z) / scale]
      : [0, 0, 0];

  return [
    ...relative(leftHand?.[HAND.wrist]),
    ...relative(rightHand?.[HAND.wrist]),
    ...relative(leftHand?.[HAND.indexTip]),
    ...relative(rightHand?.[HAND.indexTip]),
    ...relative(pose?.[POSE.nose]),
    // Điểm neo thứ sáu là giữa hai vai — chính là gốc toạ độ, nên luôn bằng 0.
    0,
    0,
    0,
  ];
}

function writeMotion(target: number[], offset: number, current: number[], previous: number[] | null) {
  for (let i = 0; i < 18; i++) {
    target[offset + i] = previous ? current[i] - previous[i] : 0;
  }
}

/**
 * 16 đặc trưng hình học — quan hệ giữa hai tay, thân và mặt.
 *
 * Đây là phần giúp mô hình phân biệt các ký hiệu có hình bàn tay giống nhau nhưng khác vị trí thực
 * hiện (trước ngực, cạnh đầu, ngang hông).
 */
function writeGeometry(
  target: number[],
  offset: number,
  leftHand: NormalizedLandmark[] | null,
  rightHand: NormalizedLandmark[] | null,
  pose: NormalizedLandmark[] | null,
  origin: { x: number; y: number; z: number },
  scale: number,
) {
  const leftWrist = leftHand?.[HAND.wrist] ?? pose?.[POSE.leftWrist] ?? null;
  const rightWrist = rightHand?.[HAND.wrist] ?? pose?.[POSE.rightWrist] ?? null;
  const nose = pose?.[POSE.nose] ?? null;
  const leftShoulder = pose?.[POSE.leftShoulder] ?? null;
  const rightShoulder = pose?.[POSE.rightShoulder] ?? null;

  const values = [
    distance(leftWrist, rightWrist) / scale,
    distance(leftWrist, nose) / scale,
    distance(rightWrist, nose) / scale,
    distance(leftWrist, leftShoulder) / scale,
    distance(rightWrist, rightShoulder) / scale,
    handSpread(leftHand) / scale,
    handSpread(rightHand) / scale,
    leftWrist ? (leftWrist.y - origin.y) / scale : 0,
    rightWrist ? (rightWrist.y - origin.y) / scale : 0,
    leftWrist ? (leftWrist.x - origin.x) / scale : 0,
    rightWrist ? (rightWrist.x - origin.x) / scale : 0,
    angleBetween(pose?.[POSE.leftElbow] ?? null, leftWrist),
    angleBetween(pose?.[POSE.rightElbow] ?? null, rightWrist),
    leftWrist && rightWrist ? (leftWrist.y - rightWrist.y) / scale : 0,
    leftWrist && rightWrist ? (leftWrist.x - rightWrist.x) / scale : 0,
    distance(leftShoulder, rightShoulder) / scale,
  ];

  values.forEach((value, index) => {
    target[offset + index] = Number.isFinite(value) ? value : 0;
  });
}

/** Tám chiều của lát `quality`, đúng thứ tự khai ở `QUALITY_FIELDS`. */
interface QualitySlice {
  leftHandPresent: number;
  rightHandPresent: number;
  poseDetected: number;
  faceDetected: number;
  handFrameRatio: number;
  bothHandsRatio: number;
  frameIndexNorm: number;
  normScale: number;
}

function writeQuality(target: number[], offset: number, quality: QualitySlice) {
  target[offset] = quality.leftHandPresent;
  target[offset + 1] = quality.rightHandPresent;
  target[offset + 2] = quality.poseDetected;
  target[offset + 3] = quality.faceDetected;
  target[offset + 4] = quality.handFrameRatio;
  target[offset + 5] = quality.bothHandsRatio;
  target[offset + 6] = quality.frameIndexNorm;
  target[offset + 7] = quality.normScale;
}

// ---------------------------------------------------------------------- tiện ích

/**
 * Lấy danh sách landmark của người đầu tiên.
 *
 * Tuỳ bản `tasks-vision`, kết quả Holistic có thể là `NormalizedLandmark[]` (một người) hoặc
 * `NormalizedLandmark[][]` (gộp theo người). Xử lý cả hai để nâng thư viện không làm vỡ luồng chấm.
 */
function firstOrNull(
  landmarks: NormalizedLandmark[] | NormalizedLandmark[][] | undefined,
): NormalizedLandmark[] | null {
  if (!landmarks || landmarks.length === 0) return null;
  const head = landmarks[0] as NormalizedLandmark | NormalizedLandmark[];
  if (Array.isArray(head)) {
    return head.length > 0 ? head : null;
  }
  return landmarks as NormalizedLandmark[];
}

/**
 * Hệ số chuẩn hoá theo khoảng cách hai vai: người đứng gần hay xa camera đều cho cùng một tensor.
 * Không có pose thì dùng 0.25 — độ rộng vai điển hình trong toạ độ đã chuẩn hoá của MediaPipe.
 */
function shoulderScale(pose: NormalizedLandmark[] | null): number {
  const fallback = 0.25;
  if (!pose) return fallback;
  const width = distance(pose[POSE.leftShoulder], pose[POSE.rightShoulder]);
  return width > 0.02 ? width : fallback;
}

/** Gốc toạ độ của cơ thể: điểm giữa hai vai. */
function bodyOrigin(pose: NormalizedLandmark[] | null): { x: number; y: number; z: number } {
  if (!pose) return { x: 0.5, y: 0.5, z: 0 };
  const left = pose[POSE.leftShoulder];
  const right = pose[POSE.rightShoulder];
  if (!left || !right) return { x: 0.5, y: 0.5, z: 0 };
  return { x: (left.x + right.x) / 2, y: (left.y + right.y) / 2, z: (left.z + right.z) / 2 };
}

function distance(
  a: NormalizedLandmark | null | undefined,
  b: NormalizedLandmark | null | undefined,
): number {
  if (!a || !b) return 0;
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}

/** Độ xoè bàn tay: khoảng cách ngón cái ↔ ngón út. */
function handSpread(hand: NormalizedLandmark[] | null): number {
  if (!hand) return 0;
  return distance(hand[HAND.thumbTip], hand[HAND.pinkyTip]);
}

/** Góc của cẳng tay so với trục ngang, tính bằng radian. */
function angleBetween(
  from: NormalizedLandmark | null,
  to: NormalizedLandmark | null | undefined,
): number {
  if (!from || !to) return 0;
  return Math.atan2(to.y - from.y, to.x - from.x);
}

function clampValue(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(-MAX_ABS_VALUE, Math.min(MAX_ABS_VALUE, Number(value.toFixed(5))));
}

function round4(value: number): number {
  return Number(value.toFixed(4));
}

/**
 * Kéo/nén chuỗi về đúng `length` khung bằng nội suy tuyến tính theo chỉ số.
 *
 * Mô hình được huấn luyện trên chuỗi cố định 64 khung, nên mọi lượt — dù người học làm nhanh hay
 * chậm — đều phải quy về cùng độ dài.
 */
function resampleTo(frames: number[][], length: number): number[][] {
  if (frames.length === 0) {
    return Array.from({ length }, () => new Array<number>(FEATURE_DIM).fill(0));
  }
  if (frames.length === 1) {
    return Array.from({ length }, () => [...frames[0]]);
  }

  const output: number[][] = [];
  const step = (frames.length - 1) / (length - 1);
  for (let i = 0; i < length; i++) {
    const position = i * step;
    const lower = Math.floor(position);
    const upper = Math.min(lower + 1, frames.length - 1);
    const weight = position - lower;

    const blended = new Array<number>(FEATURE_DIM);
    for (let dim = 0; dim < FEATURE_DIM; dim++) {
      blended[dim] = Number(
        (frames[lower][dim] * (1 - weight) + frames[upper][dim] * weight).toFixed(5),
      );
    }
    output.push(blended);
  }
  return output;
}
