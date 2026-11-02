let lastVideoTimestamp = 0;

/**
 * Một HolisticLandmarker được dùng chung cho camera và video mẫu. MediaPipe yêu
 * cầu timestamp tăng trên toàn bộ instance, vì vậy không để từng player tự giữ
 * một đồng hồ riêng.
 */
export function nextHolisticVideoTimestamp(candidate = performance.now()): number {
  lastVideoTimestamp = Math.max(candidate, lastVideoTimestamp + 1);
  return lastVideoTimestamp;
}
