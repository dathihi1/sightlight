import { describe, expect, it } from "vitest";
import { shuffleForDisplay } from "./shuffle";

describe("shuffleForDisplay", () => {
  it("xáo thứ tự mà không sửa mảng nguồn", () => {
    const source = ["Anh", "Cháu", "Chú", "Chị"];

    expect(shuffleForDisplay(source, () => 0)).toEqual(["Cháu", "Chú", "Chị", "Anh"]);
    expect(source).toEqual(["Anh", "Cháu", "Chú", "Chị"]);
  });
});
