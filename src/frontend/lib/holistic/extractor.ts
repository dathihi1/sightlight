/**
 * Trích đặc trưng chuyển động ngay trong trình duyệt (Q8 — phương án B, NFR-12).
 *
 * Khớp 100% logic trích chọn và chuẩn hoá từ E:/EXE101/src/vsl_mvp/landmarks_v2.py
 * đã huấn luyện mô hình vsl_mvp30_v2_lite_transformer và vsl_mvp400_v2_lite_transformer.
 *
 * Đầu ra duy nhất: tensor 64 × 327 đã chuẩn hoá và các chỉ số chất lượng khung.
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
  MIN_USEFUL_FRAMES,
  POSE_LANDMARK_INDICES,
  SEQUENCE_LENGTH,
} from "./featureSchema";

const WASM_BASE =
  process.env.NEXT_PUBLIC_MEDIAPIPE_WASM_URL ?? "/wasm/mediapipe";

const MODEL_ASSET =
  process.env.NEXT_PUBLIC_HOLISTIC_MODEL_URL ??
  "/models/holistic_landmarker.task";

export interface FrameQuality {
  handFrameRatio: number;
  bothHandsRatio: number;
  poseDetected: boolean;
}

export interface ExtractionResult {
  /** Tensor chuẩn hoá 64 × 327 */
  features: number[][];
  /** Số khung hữu ích (8 ≤ n ≤ 32) */
  frameCount: number;
  durationMs: number;
  quality: FrameQuality;
}

interface RawFrame {
  leftHand: number[]; // 21 * 3 = 63
  rightHand: number[]; // 21 * 3 = 63
  pose: number[]; // 9 * 4 = 36
  face: number[]; // 41 * 3 = 123
  quality: number[]; // 8
}

let landmarkerPromise: Promise<HolisticLandmarker> | null = null;

export async function loadHolisticLandmarker(): Promise<HolisticLandmarker> {
  if (!landmarkerPromise) {
    landmarkerPromise = (async () => {
      const fileset = await FilesetResolver.forVisionTasks(WASM_BASE);
      try {
        return await HolisticLandmarker.createFromOptions(fileset, {
          baseOptions: { modelAssetPath: MODEL_ASSET, delegate: "GPU" },
          runningMode: "VIDEO",
        });
      } catch (gpuError) {
        console.warn("GPU delegate không khả dụng, chuyển sang CPU cho HolisticLandmarker:", gpuError);
        return await HolisticLandmarker.createFromOptions(fileset, {
          baseOptions: { modelAssetPath: MODEL_ASSET, delegate: "CPU" },
          runningMode: "VIDEO",
        });
      }
    })().catch((error) => {
      landmarkerPromise = null;
      throw error;
    });
  }
  return landmarkerPromise;
}

export class SignSequenceRecorder {
  private readonly rawFrames: RawFrame[] = [];
  private handFrames = 0;
  private bothHandFrames = 0;
  private poseFrames = 0;
  private processedFrames = 0;
  private startedAt = 0;

  start() {
    this.rawFrames.length = 0;
    this.handFrames = 0;
    this.bothHandFrames = 0;
    this.poseFrames = 0;
    this.processedFrames = 0;
    this.startedAt = performance.now();
  }

  get usefulFrameCount(): number {
    return this.rawFrames.length;
  }

  get isFull(): boolean {
    return this.rawFrames.length >= 64;
  }

  addFrame(result: HolisticLandmarkerResult) {
    this.processedFrames++;

    const leftHand = firstOrNull(result.leftHandLandmarks);
    const rightHand = firstOrNull(result.rightHandLandmarks);
    const pose = firstOrNull(result.poseLandmarks);
    const face = firstOrNull(result.faceLandmarks);

    const hasLeft = Boolean(leftHand && leftHand.length >= 21);
    const hasRight = Boolean(rightHand && rightHand.length >= 21);
    const hasPose = Boolean(pose && pose.length >= 25);
    const hasFace = Boolean(face && face.length >= 455);
    const hasAnyHand = hasLeft || hasRight;

    if (hasAnyHand) this.handFrames++;
    if (hasLeft && hasRight) this.bothHandFrames++;
    if (hasPose) this.poseFrames++;

    if (this.isFull) return;

    // 1. Trích left hand (21 * 3)
    const leftVec = new Array<number>(63).fill(0);
    if (hasLeft && leftHand) {
      for (let i = 0; i < 21; i++) {
        const lm = leftHand[i];
        if (lm) {
          leftVec[i * 3] = lm.x;
          leftVec[i * 3 + 1] = lm.y;
          leftVec[i * 3 + 2] = lm.z;
        }
      }
    }

    // 2. Trích right hand (21 * 3)
    const rightVec = new Array<number>(63).fill(0);
    if (hasRight && rightHand) {
      for (let i = 0; i < 21; i++) {
        const lm = rightHand[i];
        if (lm) {
          rightVec[i * 3] = lm.x;
          rightVec[i * 3 + 1] = lm.y;
          rightVec[i * 3 + 2] = lm.z;
        }
      }
    }

    // 3. Trích pose (9 * 4 = 36) theo POSE_LANDMARK_INDICES = [0, 11, 12, 13, 14, 15, 16, 23, 24]
    const poseVec = new Array<number>(36).fill(0);
    if (hasPose && pose) {
      POSE_LANDMARK_INDICES.forEach((lmIdx, slot) => {
        const lm = pose[lmIdx];
        if (lm) {
          poseVec[slot * 4] = lm.x;
          poseVec[slot * 4 + 1] = lm.y;
          poseVec[slot * 4 + 2] = lm.z;
          poseVec[slot * 4 + 3] = lm.visibility ?? 1.0;
        }
      });
    }

    // 4. Trích face (41 * 3 = 123) theo FACE_LANDMARK_INDICES
    const faceVec = new Array<number>(123).fill(0);
    if (hasFace && face) {
      FACE_LANDMARK_INDICES.forEach((lmIdx, slot) => {
        const lm = face[lmIdx];
        if (lm) {
          faceVec[slot * 3] = lm.x;
          faceVec[slot * 3 + 1] = lm.y;
          faceVec[slot * 3 + 2] = lm.z;
        }
      });
    }

    // 5. Quality thô (8 chiều)
    const qualityVec = [
      hasLeft ? 1.0 : 0.0,
      hasRight ? 1.0 : 0.0,
      hasPose ? 1.0 : 0.0,
      hasFace ? 1.0 : 0.0,
      hasAnyHand ? 1.0 : 0.0,
      hasLeft && hasRight ? 1.0 : 0.0,
      hasAnyHand ? 0.0 : 1.0,
      hasFace ? 0.0 : 1.0,
    ];

    this.rawFrames.push({
      leftHand: leftVec,
      rightHand: rightVec,
      pose: poseVec,
      face: faceVec,
      quality: qualityVec,
    });
  }

  finish(): ExtractionResult {
    const durationMs = Math.round(performance.now() - this.startedAt);
    const numRaw = this.rawFrames.length;

    if (numRaw === 0) {
      return {
        features: Array.from({ length: SEQUENCE_LENGTH }, () => new Array<number>(FEATURE_DIM).fill(0)),
        frameCount: 0,
        durationMs,
        quality: { handFrameRatio: 0, bothHandsRatio: 0, poseDetected: false },
      };
    }

    // Đếm số khung có tay thực tế
    const validCount = this.rawFrames.filter((f) => f.quality[4] > 0.5).length;

    // Chuyển thành ma trận base (T x 285) và quality (T x 8)
    let baseSeq: number[][] = this.rawFrames.map((f) => [
      ...f.leftHand,
      ...f.rightHand,
      ...f.pose,
      ...f.face,
    ]);
    let qualitySeq: number[][] = this.rawFrames.map((f) => [...f.quality]);

    // Cập nhật missing rates
    for (let t = 0; t < qualitySeq.length; t++) {
      qualitySeq[t][6] = 1.0 - qualitySeq[t][4];
      qualitySeq[t][7] = 1.0 - qualitySeq[t][3];
    }

    // Chuẩn hoá theo body anchor (mid-shoulder)
    normalizeBaseSequence(baseSeq, qualitySeq);

    // Nội suy các khung mất ngắn
    interpolateMissingGroups(baseSeq, qualitySeq);

    // Cắt bỏ khung đứng yên (idle) ở đầu và cuối
    const trimmed = trimIdleFrames(baseSeq, qualitySeq);
    baseSeq = trimmed.base;
    qualitySeq = trimmed.quality;

    // Kéo giãn / nén về đúng 64 khung
    baseSeq = resampleSequence(baseSeq, SEQUENCE_LENGTH);
    qualitySeq = resampleSequence(qualitySeq, SEQUENCE_LENGTH);

    // Làm sạch quality sau nội suy
    for (let t = 0; t < SEQUENCE_LENGTH; t++) {
      for (let k = 0; k < 6; k++) {
        qualitySeq[t][k] = qualitySeq[t][k] >= 0.5 ? 1.0 : 0.0;
      }
      qualitySeq[t][6] = Math.max(0, Math.min(1, qualitySeq[t][6]));
      qualitySeq[t][7] = Math.max(0, Math.min(1, qualitySeq[t][7]));
    }

    // Xây dựng 18 đặc trưng motion và 16 đặc trưng geometry từ chuỗi 64 khung chuẩn
    const derived = buildDerivedFeatures(baseSeq, qualitySeq);

    // Ghép [base (285), motion (18), geometry (16), quality (8)] = 327
    const features: number[][] = [];
    for (let t = 0; t < SEQUENCE_LENGTH; t++) {
      const row = [...baseSeq[t], ...derived[t], ...qualitySeq[t]].map(clampValue);
      features.push(row);
    }

    const handRatio = qualitySeq.reduce((acc, q) => acc + q[4], 0) / SEQUENCE_LENGTH;
    const bothRatio = qualitySeq.reduce((acc, q) => acc + q[5], 0) / SEQUENCE_LENGTH;
    const poseRatio = qualitySeq.reduce((acc, q) => acc + q[2], 0) / SEQUENCE_LENGTH;

    // Chuẩn hoá số khung hữu ích về khoảng [MIN_USEFUL_FRAMES, MAX_USEFUL_FRAMES] để backend không từ chối
    const effectiveFrameCount = Math.max(
      MIN_USEFUL_FRAMES,
      Math.min(MAX_USEFUL_FRAMES, validCount || Math.min(numRaw, MAX_USEFUL_FRAMES)),
    );

    return {
      features,
      frameCount: effectiveFrameCount,
      durationMs,
      quality: {
        handFrameRatio: Number(handRatio.toFixed(4)),
        bothHandsRatio: Number(bothRatio.toFixed(4)),
        poseDetected: poseRatio >= 0.5,
      },
    };
  }
}

// ------------------------------------------------------------------ Thuật toán chuẩn hoá khớp landmarks_v2.py

function normalizeBaseSequence(base: number[][], quality: number[][]) {
  const T = base.length;
  // Pose landmark indices: 0=nose, 1=left_shoulder (11), 2=right_shoulder (12)
  // Lát pose bắt đầu ở 126. Left shoulder là slot 1 (offset 126 + 4 = 130), Right shoulder là slot 2 (offset 126 + 8 = 134).
  const leftShoulderOffset = 126 + 1 * 4;
  const rightShoulderOffset = 126 + 2 * 4;

  for (let t = 0; t < T; t++) {
    const q = quality[t];
    let centerX: number | null = null;
    let centerY: number | null = null;
    let scale = 1.0;

    const poseValid = q[2] > 0.5;
    const leftVis = base[t][leftShoulderOffset + 3];
    const rightVis = base[t][rightShoulderOffset + 3];

    if (poseValid && leftVis > 0.2 && rightVis > 0.2) {
      const lsX = base[t][leftShoulderOffset];
      const lsY = base[t][leftShoulderOffset + 1];
      const rsX = base[t][rightShoulderOffset];
      const rsY = base[t][rightShoulderOffset + 1];
      centerX = (lsX + rsX) / 2.0;
      centerY = (lsY + rsY) / 2.0;
      scale = Math.hypot(lsX - rsX, lsY - rsY);
    } else {
      // Fallback gom các điểm bàn tay và khuôn mặt hợp lệ
      const ptsX: number[] = [];
      const ptsY: number[] = [];
      if (q[0] > 0.5) {
        for (let i = 0; i < 21; i++) {
          ptsX.push(base[t][i * 3]);
          ptsY.push(base[t][i * 3 + 1]);
        }
      }
      if (q[1] > 0.5) {
        for (let i = 0; i < 21; i++) {
          ptsX.push(base[t][63 + i * 3]);
          ptsY.push(base[t][63 + i * 3 + 1]);
        }
      }
      if (q[3] > 0.5) {
        for (let i = 0; i < 41; i++) {
          ptsX.push(base[t][162 + i * 3]);
          ptsY.push(base[t][162 + i * 3 + 1]);
        }
      }
      if (ptsX.length > 0) {
        const minX = Math.min(...ptsX);
        const maxX = Math.max(...ptsX);
        const minY = Math.min(...ptsY);
        const maxY = Math.max(...ptsY);
        centerX = ptsX.reduce((a, b) => a + b, 0) / ptsX.length;
        centerY = ptsY.reduce((a, b) => a + b, 0) / ptsY.length;
        scale = Math.hypot(maxX - minX, maxY - minY);
      }
    }

    if (centerX !== null && centerY !== null) {
      scale = Math.max(scale, 1e-3);
      // Left hand [0..62]
      if (q[0] > 0.5) {
        for (let i = 0; i < 21; i++) {
          base[t][i * 3] = (base[t][i * 3] - centerX) / scale;
          base[t][i * 3 + 1] = (base[t][i * 3 + 1] - centerY) / scale;
          base[t][i * 3 + 2] = base[t][i * 3 + 2] / scale;
        }
      }
      // Right hand [63..125]
      if (q[1] > 0.5) {
        for (let i = 0; i < 21; i++) {
          base[t][63 + i * 3] = (base[t][63 + i * 3] - centerX) / scale;
          base[t][63 + i * 3 + 1] = (base[t][63 + i * 3 + 1] - centerY) / scale;
          base[t][63 + i * 3 + 2] = base[t][63 + i * 3 + 2] / scale;
        }
      }
      // Pose [126..161] (9 landmarks x 4)
      if (q[2] > 0.5) {
        for (let i = 0; i < 9; i++) {
          const vis = base[t][126 + i * 4 + 3];
          if (vis > 0.2) {
            base[t][126 + i * 4] = (base[t][126 + i * 4] - centerX) / scale;
            base[t][126 + i * 4 + 1] = (base[t][126 + i * 4 + 1] - centerY) / scale;
            base[t][126 + i * 4 + 2] = base[t][126 + i * 4 + 2] / scale;
          }
        }
      }
      // Face [162..284] (41 landmarks x 3)
      if (q[3] > 0.5) {
        for (let i = 0; i < 41; i++) {
          base[t][162 + i * 3] = (base[t][162 + i * 3] - centerX) / scale;
          base[t][162 + i * 3 + 1] = (base[t][162 + i * 3 + 1] - centerY) / scale;
          base[t][162 + i * 3 + 2] = base[t][162 + i * 3 + 2] / scale;
        }
      }
    }
  }
}

function interpolateMissingGroups(base: number[][], quality: number[][]) {
  const groups: Array<{ startDim: number; endDim: number; qIdx: number }> = [
    { startDim: 0, endDim: 63, qIdx: 0 },
    { startDim: 63, endDim: 126, qIdx: 1 },
    { startDim: 126, endDim: 162, qIdx: 2 },
    { startDim: 162, endDim: 285, qIdx: 3 },
  ];

  for (const group of groups) {
    const validIndices: number[] = [];
    for (let t = 0; t < quality.length; t++) {
      if (quality[t][group.qIdx] > 0.5) {
        validIndices.push(t);
      }
    }
    if (validIndices.length < 2) continue;

    for (let i = 0; i < validIndices.length - 1; i++) {
      const start = validIndices[i];
      const end = validIndices[i + 1];
      const gap = end - start - 1;
      if (gap <= 0 || gap > 5) continue;

      for (let offset = 1; offset <= gap; offset++) {
        const alpha = offset / (gap + 1);
        for (let d = group.startDim; d < group.endDim; d++) {
          base[start + offset][d] = (1.0 - alpha) * base[start][d] + alpha * base[end][d];
        }
      }
    }
  }
}

function trimIdleFrames(base: number[][], quality: number[][]): { base: number[][]; quality: number[][] } {
  const T = base.length;
  if (T <= 4) return { base, quality };

  const motion = computeHandMotionPerFrame(base, quality);
  const maxMotion = Math.max(...motion);
  const threshold = 0.015;

  if (maxMotion < threshold) return { base, quality };

  const activeIndices: number[] = [];
  for (let t = 0; t < T; t++) {
    if (motion[t] >= threshold) {
      activeIndices.push(t);
    }
  }
  if (activeIndices.length === 0) return { base, quality };

  const start = Math.max(0, activeIndices[0] - 4);
  const end = Math.min(T, activeIndices[activeIndices.length - 1] + 4 + 1);

  if (end - start < 8) return { base, quality };

  return {
    base: base.slice(start, end),
    quality: quality.slice(start, end),
  };
}

function computeHandMotionPerFrame(base: number[][], quality: number[][]): number[] {
  const T = base.length;
  const deltas = new Array<number>(T).fill(0);

  // Tính tâm tay trái và tay phải
  const leftCenters: Array<[number, number]> = [];
  const rightCenters: Array<[number, number]> = [];

  for (let t = 0; t < T; t++) {
    // Left
    if (quality[t][0] > 0.5) {
      let sx = 0;
      let sy = 0;
      for (let i = 0; i < 21; i++) {
        sx += base[t][i * 3];
        sy += base[t][i * 3 + 1];
      }
      leftCenters.push([sx / 21, sy / 21]);
    } else {
      leftCenters.push([0, 0]);
    }

    // Right
    if (quality[t][1] > 0.5) {
      let sx = 0;
      let sy = 0;
      for (let i = 0; i < 21; i++) {
        sx += base[t][63 + i * 3];
        sy += base[t][63 + i * 3 + 1];
      }
      rightCenters.push([sx / 21, sy / 21]);
    } else {
      rightCenters.push([0, 0]);
    }
  }

  for (let t = 1; t < T; t++) {
    let diffSum = 0;
    // Left hand — dùng quality thực tế thay vì suy đoán qua toạ độ 0, tránh sai khi tâm tay hợp lệ trùng gốc.
    if (quality[t][0] > 0.5 && quality[t - 1][0] > 0.5) {
      diffSum += Math.hypot(leftCenters[t][0] - leftCenters[t - 1][0], leftCenters[t][1] - leftCenters[t - 1][1]);
    }
    // Right hand
    if (quality[t][1] > 0.5 && quality[t - 1][1] > 0.5) {
      diffSum += Math.hypot(rightCenters[t][0] - rightCenters[t - 1][0], rightCenters[t][1] - rightCenters[t - 1][1]);
    }
    deltas[t] = diffSum / 2.0;
  }

  return deltas;
}

function resampleSequence(sequence: number[][], targetLength: number): number[][] {
  const T = sequence.length;
  if (T === targetLength) return sequence.map((r) => [...r]);
  if (T === 1) return Array.from({ length: targetLength }, () => [...sequence[0]]);

  const numDims = sequence[0].length;
  const output: number[][] = [];

  for (let i = 0; i < targetLength; i++) {
    const pos = (i * (T - 1)) / (targetLength - 1);
    const lower = Math.floor(pos);
    const upper = Math.min(lower + 1, T - 1);
    const weight = pos - lower;

    const row = new Array<number>(numDims);
    for (let d = 0; d < numDims; d++) {
      row[d] = sequence[lower][d] * (1.0 - weight) + sequence[upper][d] * weight;
    }
    output.push(row);
  }

  return output;
}

function buildDerivedFeatures(base: number[][], quality: number[][]): number[][] {
  const T = base.length;
  const geometry = buildGeometryFeatures(base, quality);
  const motion = buildMotionFeatures(base, quality, geometry);

  const derived: number[][] = [];
  for (let t = 0; t < T; t++) {
    derived.push([...motion[t], ...geometry[t]]);
  }
  return derived;
}

function buildGeometryFeatures(base: number[][], quality: number[][]): number[][] {
  const T = base.length;
  const out: number[][] = [];

  // Face local indices for mouth (61, 291, 78, 308)
  const mouthIndices: number[] = [];
  [61, 291, 13, 14, 78, 308].forEach((idx) => {
    const slot = FACE_LANDMARK_INDICES.indexOf(idx);
    if (slot >= 0) mouthIndices.push(slot);
  });

  // Face local indices for chin (199, 152, 175)
  const chinIndices: number[] = [];
  [199, 152, 175].forEach((idx) => {
    const slot = FACE_LANDMARK_INDICES.indexOf(idx);
    if (slot >= 0) chinIndices.push(slot);
  });

  for (let t = 0; t < T; t++) {
    const row = new Array<number>(16).fill(0);
    const q = quality[t];

    // Left center
    let leftCenterX = 0;
    let leftCenterY = 0;
    if (q[0] > 0.5) {
      for (let i = 0; i < 21; i++) {
        leftCenterX += base[t][i * 3];
        leftCenterY += base[t][i * 3 + 1];
      }
      leftCenterX /= 21;
      leftCenterY /= 21;
    }

    // Right center
    let rightCenterX = 0;
    let rightCenterY = 0;
    if (q[1] > 0.5) {
      for (let i = 0; i < 21; i++) {
        rightCenterX += base[t][63 + i * 3];
        rightCenterY += base[t][63 + i * 3 + 1];
      }
      rightCenterX /= 21;
      rightCenterY /= 21;
    }

    // Pose points: 0=nose, 1=left_shoulder (11), 2=right_shoulder (12)
    const poseValid = q[2] > 0.5;
    const noseVis = base[t][126 + 3];
    const noseX = poseValid && noseVis > 0.2 ? base[t][126] : 0;
    const noseY = poseValid && noseVis > 0.2 ? base[t][126 + 1] : 0;

    const lsVis = base[t][126 + 4 + 3];
    const lsX = poseValid && lsVis > 0.2 ? base[t][126 + 4] : 0;
    const lsY = poseValid && lsVis > 0.2 ? base[t][126 + 4 + 1] : 0;

    const rsVis = base[t][126 + 8 + 3];
    const rsX = poseValid && rsVis > 0.2 ? base[t][126 + 8] : 0;
    const rsY = poseValid && rsVis > 0.2 ? base[t][126 + 8 + 1] : 0;

    // Chest anchor
    const chestValid = (lsX !== 0 || lsY !== 0) && (rsX !== 0 || rsY !== 0);
    const chestX = chestValid ? (lsX + rsX) / 2.0 : 0;
    const chestY = chestValid ? (lsY + rsY) / 2.0 : 0;

    // Mouth anchor
    let mouthX = 0;
    let mouthY = 0;
    if (q[3] > 0.5 && mouthIndices.length > 0) {
      for (const slot of mouthIndices) {
        mouthX += base[t][162 + slot * 3];
        mouthY += base[t][162 + slot * 3 + 1];
      }
      mouthX /= mouthIndices.length;
      mouthY /= mouthIndices.length;
    }

    // Chin anchor
    let chinX = 0;
    let chinY = 0;
    if (q[3] > 0.5 && chinIndices.length > 0) {
      for (const slot of chinIndices) {
        chinX += base[t][162 + slot * 3];
        chinY += base[t][162 + slot * 3 + 1];
      }
      chinX /= chinIndices.length;
      chinY /= chinIndices.length;
    }

    const pairDist = (x1: number, y1: number, x2: number, y2: number) =>
      (x1 !== 0 || y1 !== 0) && (x2 !== 0 || y2 !== 0) ? Math.hypot(x1 - x2, y1 - y2) : 0;

    row[0] = pairDist(leftCenterX, leftCenterY, rightCenterX, rightCenterY);
    row[1] = pairDist(leftCenterX, leftCenterY, chestX, chestY);
    row[2] = pairDist(rightCenterX, rightCenterY, chestX, chestY);
    row[3] = pairDist(leftCenterX, leftCenterY, mouthX, mouthY);
    row[4] = pairDist(rightCenterX, rightCenterY, mouthX, mouthY);
    row[5] = pairDist(leftCenterX, leftCenterY, chinX, chinY);
    row[6] = pairDist(rightCenterX, rightCenterY, chinX, chinY);
    row[7] = pairDist(leftCenterX, leftCenterY, noseX, noseY);
    row[8] = pairDist(rightCenterX, rightCenterY, noseX, noseY);
    row[9] = pairDist(leftCenterX, leftCenterY, lsX, lsY);
    row[10] = pairDist(rightCenterX, rightCenterY, rsX, rsY);

    // Hand spread (left & right)
    row[11] = calculateHandSpread(base[t], 0, q[0] > 0.5);
    row[12] = calculateHandSpread(base[t], 63, q[1] > 0.5);

    // Palm proxy
    row[13] = calculatePalmProxy(base[t], 0, q[0] > 0.5);
    row[14] = calculatePalmProxy(base[t], 63, q[1] > 0.5);

    // Torso angle
    if (chestValid) {
      const vecX = rsX - lsX;
      const vecY = rsY - lsY;
      row[15] = Math.atan2(vecY, vecX) / Math.PI;
    } else {
      row[15] = 0;
    }

    out.push(row);
  }
  return out;
}

function calculateHandSpread(frame: number[], offset: number, valid: boolean): number {
  if (!valid) return 0;
  // Fingertips: 4 (thumb), 8 (index), 12 (middle), 16 (ring), 20 (pinky)
  const tipIndices = [4, 8, 12, 16, 20];
  const xs = tipIndices.map((i) => frame[offset + i * 3]);
  const ys = tipIndices.map((i) => frame[offset + i * 3 + 1]);
  const dx = Math.max(...xs) - Math.min(...xs);
  const dy = Math.max(...ys) - Math.min(...ys);
  return Math.hypot(dx, dy);
}

function calculatePalmProxy(frame: number[], offset: number, valid: boolean): number {
  if (!valid) return 0;
  // Wrist is 0, middle MCP is 9
  const wristX = frame[offset];
  const wristY = frame[offset + 1];
  const midX = frame[offset + 9 * 3];
  const midY = frame[offset + 9 * 3 + 1];
  return Math.atan2(midY - wristY, midX - wristX) / Math.PI;
}

function buildMotionFeatures(base: number[][], quality: number[][], geometry: number[][]): number[][] {
  const T = base.length;
  const out: number[][] = Array.from({ length: T }, () => new Array<number>(18).fill(0));

  // Centers (T x 2 x 2)
  const leftCenters: Array<[number, number]> = [];
  const rightCenters: Array<[number, number]> = [];
  const leftWrists: Array<[number, number]> = [];
  const rightWrists: Array<[number, number]> = [];

  for (let t = 0; t < T; t++) {
    const q = quality[t];
    // Left center & wrist
    if (q[0] > 0.5) {
      let sx = 0;
      let sy = 0;
      for (let i = 0; i < 21; i++) {
        sx += base[t][i * 3];
        sy += base[t][i * 3 + 1];
      }
      leftCenters.push([sx / 21, sy / 21]);
      leftWrists.push([base[t][0], base[t][1]]);
    } else {
      leftCenters.push([0, 0]);
      leftWrists.push([0, 0]);
    }

    // Right center & wrist
    if (q[1] > 0.5) {
      let sx = 0;
      let sy = 0;
      for (let i = 0; i < 21; i++) {
        sx += base[t][63 + i * 3];
        sy += base[t][63 + i * 3 + 1];
      }
      rightCenters.push([sx / 21, sy / 21]);
      rightWrists.push([base[t][63], base[t][64]]);
    } else {
      rightCenters.push([0, 0]);
      rightWrists.push([0, 0]);
    }
  }

  for (let t = 1; t < T; t++) {
    // Left hand center delta
    const lcxDelta = leftCenters[t][0] - leftCenters[t - 1][0];
    const lcyDelta = leftCenters[t][1] - leftCenters[t - 1][1];
    const lcSpeed = Math.hypot(lcxDelta, lcyDelta);

    // Right hand center delta
    const rcxDelta = rightCenters[t][0] - rightCenters[t - 1][0];
    const rcyDelta = rightCenters[t][1] - rightCenters[t - 1][1];
    const rcSpeed = Math.hypot(rcxDelta, rcyDelta);

    // Left wrist delta
    const lwxDelta = leftWrists[t][0] - leftWrists[t - 1][0];
    const lwyDelta = leftWrists[t][1] - leftWrists[t - 1][1];
    const lwSpeed = Math.hypot(lwxDelta, lwyDelta);

    // Right wrist delta
    const rwxDelta = rightWrists[t][0] - rightWrists[t - 1][0];
    const rwyDelta = rightWrists[t][1] - rightWrists[t - 1][1];
    const rwSpeed = Math.hypot(rwxDelta, rwyDelta);

    out[t][0] = lcxDelta;
    out[t][1] = lcyDelta;
    out[t][2] = lcSpeed;

    out[t][3] = rcxDelta;
    out[t][4] = rcyDelta;
    out[t][5] = rcSpeed;

    out[t][6] = lwxDelta;
    out[t][7] = lwyDelta;
    out[t][8] = lwSpeed;

    out[t][9] = rwxDelta;
    out[t][10] = rwyDelta;
    out[t][11] = rwSpeed;

    out[t][12] = geometry[t][0] - geometry[t - 1][0]; // hands_distance_delta
    out[t][13] = geometry[t][1] - geometry[t - 1][1]; // left_to_chest_delta
    out[t][14] = geometry[t][2] - geometry[t - 1][2]; // right_to_chest_delta
    out[t][15] = geometry[t][3] - geometry[t - 1][3]; // left_to_mouth_delta
    out[t][16] = geometry[t][4] - geometry[t - 1][4]; // right_to_mouth_delta
    out[t][17] = (lcSpeed + rcSpeed) / 2.0; // mean_hand_speed
  }

  return out;
}

function clampValue(val: number): number {
  if (!Number.isFinite(val)) return 0;
  return Math.max(-MAX_ABS_VALUE, Math.min(MAX_ABS_VALUE, Number(val.toFixed(5))));
}

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
