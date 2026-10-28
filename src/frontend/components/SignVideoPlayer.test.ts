import { describe, expect, it } from "vitest";
import { withR2VideoRevision } from "./SignVideoPlayer";

describe("withR2VideoRevision", () => {
  it("phá cache cho video trên R2", () => {
    expect(withR2VideoRevision("https://pub-example.r2.dev/raw/000732.mp4"))
      .toBe("https://pub-example.r2.dev/raw/000732.mp4?v=20261021-h264");
  });

  it("giữ query string hiện có", () => {
    expect(withR2VideoRevision("https://pub-example.r2.dev/raw/000010.mp4?download=1"))
      .toBe("https://pub-example.r2.dev/raw/000010.mp4?download=1&v=20261021-h264");
  });

  it("không thay đổi nguồn không thuộc R2", () => {
    expect(withR2VideoRevision("https://cdn.example.com/video.mp4"))
      .toBe("https://cdn.example.com/video.mp4");
  });
});
