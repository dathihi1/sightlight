import { tokenStore } from "@/lib/api";

const DEFAULT_VIDEO_PROCESSING_BASE_URL =
  "https://signlight-video-processing.thankfulocean-a6c2129d.eastasia.azurecontainerapps.io";

export const serverVideoEnabled =
  process.env.NEXT_PUBLIC_SERVER_VIDEO_ENABLED !== "false";

export const videoProcessingBaseUrl = (
  process.env.NEXT_PUBLIC_VIDEO_PROCESSING_BASE_URL ??
  DEFAULT_VIDEO_PROCESSING_BASE_URL
).replace(/\/$/, "");

export interface ServerVideoTimings {
  uploadMs: number;
  authorizationMs: number;
  videoDecodingMs: number;
  landmarkExtractionMs: number;
  tensorPreprocessingMs: number;
  backendAndAiMs: number;
  totalMs: number;
}

export interface ServerVideoMetadata {
  container: string;
  codec: string;
  width: number;
  height: number;
  sourceFps: number;
  durationMs: number;
  decodedFrames: number;
  sampledFrames: number;
}

export interface ServerExtractionQuality {
  rawLandmarkFrames: number;
  effectiveFrames: number;
  handFrameRatio: number;
  bothHandsRatio: number;
  poseDetected: boolean;
}

export interface ServerVideoResponse<TAttempt> {
  requestId: string;
  status: string;
  predictedLabel: string | null;
  confidence: number | null;
  modelVersion: string;
  verified: boolean;
  qualityHints: string[];
  processingTimeMs: number;
  timings: ServerVideoTimings;
  video: ServerVideoMetadata;
  // Optional during rolling deployments: older service revisions do not return it yet.
  extraction?: ServerExtractionQuality;
  retainedMedia: boolean;
  attempt: TAttempt;
}

export function preferredRecordingMimeType(): string | null {
  if (typeof MediaRecorder === "undefined") return null;
  const candidates = [
    "video/webm;codecs=vp8",
    "video/webm;codecs=vp9",
    "video/webm",
    "video/mp4;codecs=avc1",
    "video/mp4",
  ];
  return candidates.find((value) => MediaRecorder.isTypeSupported(value)) ?? null;
}

export function videoFileExtension(mimeType: string): string {
  return mimeType.startsWith("video/mp4") ? "mp4" : "webm";
}

export async function uploadServerVideo<TAttempt>({
  blob,
  targetSignId,
  modelVersion,
  sessionId,
}: {
  blob: Blob;
  targetSignId: string;
  modelVersion: string;
  sessionId?: string | null;
}): Promise<ServerVideoResponse<TAttempt>> {
  if (!serverVideoEnabled) {
    throw new Error("Chế độ xử lý video trên server chưa được bật.");
  }
  const accessToken = tokenStore.get();
  if (!accessToken) {
    throw new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
  }

  const requestId = crypto.randomUUID();
  const extension = videoFileExtension(blob.type);
  const formData = new FormData();
  formData.append("video", blob, `signlight-${requestId}.${extension}`);
  formData.append("targetSignId", targetSignId);
  formData.append("modelVersion", modelVersion);
  formData.append("requestId", requestId);
  formData.append("consent", "true");
  if (sessionId) formData.append("sessionId", sessionId);

  const response = await fetch(`${videoProcessingBaseUrl}/v1/video/infer`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "X-Request-Id": requestId,
    },
    body: formData,
  });

  const payload = (await response.json().catch(() => null)) as
    | ServerVideoResponse<TAttempt>
    | { message?: string; errorCode?: string }
    | null;
  if (!response.ok) {
    const message = payload && "message" in payload ? payload.message : null;
    throw new Error(message || `Máy chủ video từ chối yêu cầu (${response.status}).`);
  }
  if (!payload || !("attempt" in payload)) {
    throw new Error("Máy chủ video trả về dữ liệu không hợp lệ.");
  }
  return payload;
}
