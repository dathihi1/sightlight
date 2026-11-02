import { afterEach, describe, expect, it, vi } from "vitest";
import { tokenStore } from "@/lib/api";
import { uploadServerVideo } from "@/lib/serverVideo";

const responsePayload = {
  requestId: "00000000-0000-4000-8000-000000000001",
  status: "verified",
  predictedLabel: "Anh",
  confidence: 0.91,
  modelVersion: "vsl-mvp30-v2-lite-transformer",
  verified: true,
  qualityHints: [],
  processingTimeMs: 840,
  timings: {
    uploadMs: 20,
    authorizationMs: 30,
    videoDecodingMs: 80,
    landmarkExtractionMs: 600,
    tensorPreprocessingMs: 10,
    backendAndAiMs: 100,
    totalMs: 840,
  },
  video: {
    container: "webm",
    codec: "vp80",
    width: 640,
    height: 480,
    sourceFps: 30,
    durationMs: 2000,
    decodedFrames: 60,
    sampledFrames: 32,
  },
  extraction: {
    rawLandmarkFrames: 32,
    effectiveFrames: 28,
    handFrameRatio: 0.9,
    bothHandsRatio: 0.6,
    poseDetected: true,
  },
  retainedMedia: false,
  attempt: { attemptId: "attempt-1", verified: true },
};

describe("uploadServerVideo", () => {
  afterEach(() => tokenStore.clear());

  it("sends an authenticated multipart upload with explicit consent", async () => {
    tokenStore.set("access-token");
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify(responsePayload), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const result = await uploadServerVideo({
      blob: new Blob(["video"], { type: "video/webm" }),
      targetSignId: "00000000-0000-0000-0000-000000000002",
      modelVersion: "vsl-mvp30-v2-lite-transformer",
      sessionId: "00000000-0000-0000-0000-000000000003",
    });

    expect(result.extraction?.handFrameRatio).toBe(0.9);
    const [, request] = fetchMock.mock.calls[0];
    expect(request?.headers).toMatchObject({ Authorization: "Bearer access-token" });
    const form = request?.body as FormData;
    expect(form.get("consent")).toBe("true");
    expect(form.get("targetSignId")).toBe("00000000-0000-0000-0000-000000000002");
    expect(form.get("video")).toBeInstanceOf(Blob);
  });

  it("does not upload without an access token", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch");
    await expect(
      uploadServerVideo({
        blob: new Blob(["video"], { type: "video/webm" }),
        targetSignId: "00000000-0000-0000-0000-000000000002",
        modelVersion: "vsl-mvp30-v2-lite-transformer",
      }),
    ).rejects.toThrow("Phiên đăng nhập");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
