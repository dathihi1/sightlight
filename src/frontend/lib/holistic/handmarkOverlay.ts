import type { HolisticLandmarkerResult, NormalizedLandmark } from "@mediapipe/tasks-vision";

export type HandmarkVisibility = "none" | "one" | "two";

const HAND_CONNECTIONS: ReadonlyArray<readonly [number, number]> = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [17, 18], [18, 19], [19, 20], [0, 17],
];

interface CoverProjection {
  renderedWidth: number;
  renderedHeight: number;
  offsetX: number;
  offsetY: number;
}

export type HandmarkObjectFit = "cover" | "contain";

/** Chiếu tọa độ video chuẩn hóa lên vùng `object-cover` của camera. */
export function projectLandmarkToCover(
  landmark: Pick<NormalizedLandmark, "x" | "y">,
  sourceWidth: number,
  sourceHeight: number,
  viewportWidth: number,
  viewportHeight: number,
): { x: number; y: number } {
  const projection = coverProjection(sourceWidth, sourceHeight, viewportWidth, viewportHeight);
  return {
    x: projection.offsetX + landmark.x * projection.renderedWidth,
    y: projection.offsetY + landmark.y * projection.renderedHeight,
  };
}

/** Chiếu tọa độ video chuẩn hóa lên vùng `object-contain` của video mẫu. */
export function projectLandmarkToContain(
  landmark: Pick<NormalizedLandmark, "x" | "y">,
  sourceWidth: number,
  sourceHeight: number,
  viewportWidth: number,
  viewportHeight: number,
): { x: number; y: number } {
  const projection = objectFitProjection(sourceWidth, sourceHeight, viewportWidth, viewportHeight, "contain");
  return {
    x: projection.offsetX + landmark.x * projection.renderedWidth,
    y: projection.offsetY + landmark.y * projection.renderedHeight,
  };
}

export function drawHandmarkOverlay(
  canvas: HTMLCanvasElement | null,
  video: HTMLVideoElement,
  result: HolisticLandmarkerResult,
  objectFit: HandmarkObjectFit = "cover",
): HandmarkVisibility {
  if (!canvas || video.videoWidth <= 0 || video.videoHeight <= 0) return "none";
  const context = canvas.getContext("2d");
  if (!context) return "none";

  const width = Math.max(1, canvas.clientWidth);
  const height = Math.max(1, canvas.clientHeight);
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const pixelWidth = Math.round(width * dpr);
  const pixelHeight = Math.round(height * dpr);
  if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
    canvas.width = pixelWidth;
    canvas.height = pixelHeight;
  }
  context.setTransform(dpr, 0, 0, dpr, 0, 0);
  context.clearRect(0, 0, width, height);

  const left = firstHand(result.leftHandLandmarks);
  const right = firstHand(result.rightHandLandmarks);
  if (left) drawHand(context, left, "#38bdf8", video.videoWidth, video.videoHeight, width, height, objectFit);
  if (right) drawHand(context, right, "#fbbf24", video.videoWidth, video.videoHeight, width, height, objectFit);
  if (left && right) return "two";
  return left || right ? "one" : "none";
}

export function clearHandmarkOverlay(canvas: HTMLCanvasElement | null): void {
  if (!canvas) return;
  canvas.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
}

function drawHand(
  context: CanvasRenderingContext2D,
  landmarks: NormalizedLandmark[],
  color: string,
  sourceWidth: number,
  sourceHeight: number,
  viewportWidth: number,
  viewportHeight: number,
  objectFit: HandmarkObjectFit,
): void {
  if (landmarks.length < 21) return;
  const projection = objectFitProjection(
    sourceWidth,
    sourceHeight,
    viewportWidth,
    viewportHeight,
    objectFit,
  );
  const points = landmarks.map((landmark) => ({
    x: projection.offsetX + landmark.x * projection.renderedWidth,
    y: projection.offsetY + landmark.y * projection.renderedHeight,
  }));

  context.save();
  context.lineCap = "round";
  context.lineJoin = "round";
  context.lineWidth = Math.max(2, viewportWidth / 240);
  context.strokeStyle = color;
  context.shadowColor = "rgba(0, 0, 0, 0.45)";
  context.shadowBlur = 4;
  for (const [from, to] of HAND_CONNECTIONS) {
    const start = points[from];
    const end = points[to];
    if (!start || !end) continue;
    context.beginPath();
    context.moveTo(start.x, start.y);
    context.lineTo(end.x, end.y);
    context.stroke();
  }

  context.fillStyle = "#ffffff";
  context.strokeStyle = color;
  context.lineWidth = Math.max(1.5, viewportWidth / 360);
  const radius = Math.max(2.5, viewportWidth / 150);
  for (const point of points) {
    context.beginPath();
    context.arc(point.x, point.y, radius, 0, Math.PI * 2);
    context.fill();
    context.stroke();
  }
  context.restore();
}

function coverProjection(
  sourceWidth: number,
  sourceHeight: number,
  viewportWidth: number,
  viewportHeight: number,
): CoverProjection {
  return objectFitProjection(sourceWidth, sourceHeight, viewportWidth, viewportHeight, "cover");
}

function objectFitProjection(
  sourceWidth: number,
  sourceHeight: number,
  viewportWidth: number,
  viewportHeight: number,
  objectFit: HandmarkObjectFit,
): CoverProjection {
  const scale = objectFit === "contain"
    ? Math.min(viewportWidth / sourceWidth, viewportHeight / sourceHeight)
    : Math.max(viewportWidth / sourceWidth, viewportHeight / sourceHeight);
  const renderedWidth = sourceWidth * scale;
  const renderedHeight = sourceHeight * scale;
  return {
    renderedWidth,
    renderedHeight,
    offsetX: (viewportWidth - renderedWidth) / 2,
    offsetY: (viewportHeight - renderedHeight) / 2,
  };
}

function firstHand(
  landmarks: NormalizedLandmark[][] | undefined,
): NormalizedLandmark[] | null {
  const first = landmarks?.[0];
  return first && first.length >= 21 ? first : null;
}
