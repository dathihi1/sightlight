import { describe, expect, it } from "vitest";
import { projectLandmarkToCover } from "@/lib/holistic/handmarkOverlay";

describe("projectLandmarkToCover", () => {
  it("keeps the center aligned for a matching aspect ratio", () => {
    expect(projectLandmarkToCover({ x: 0.5, y: 0.5 }, 640, 480, 320, 240)).toEqual({
      x: 160,
      y: 120,
    });
  });

  it("accounts for horizontal cropping produced by object-cover", () => {
    expect(projectLandmarkToCover({ x: 0.5, y: 0.5 }, 640, 480, 240, 240)).toEqual({
      x: 120,
      y: 120,
    });
    expect(projectLandmarkToCover({ x: 0, y: 0.5 }, 640, 480, 240, 240).x).toBe(-40);
  });
});
