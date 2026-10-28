import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ExerciseRenderer } from "./ExerciseRenderer";
import type { ExerciseNode } from "@/lib/lesson-types";

vi.mock("@/components/SignVideoPlayer", () => ({
  SignVideoPlayer: ({ videoUrl, title }: { videoUrl?: string | null; title?: string }) => (
    <div data-testid="sign-video" data-url={videoUrl ?? ""}>{title}</div>
  ),
}));

const baseExercise: ExerciseNode = {
  id: "exercise-1",
  type: "MATCH_SIGN_MEANING",
  promptText: "Nối đúng các cặp",
  videoUrl: null,
  placeholderVideo: false,
  tokens: null,
  options: [
    { id: "option-anh", labelText: "Anh", videoUrl: "/anh.mp4" },
    { id: "option-chau", labelText: "Cháu", videoUrl: "/chau.mp4" },
  ],
};

describe("ExerciseRenderer", () => {
  it("hiển thị video ký hiệu trong bài nối", () => {
    render(
      <ExerciseRenderer
        exercise={baseExercise}
        selectedOptionId={null}
        typedAnswer=""
        onSelectOption={vi.fn()}
        onTypeAnswer={vi.fn()}
        disabled={false}
      />,
    );

    expect(screen.getAllByTestId("sign-video")).toHaveLength(2);
    expect(screen.getByText("Anh")).toBeInTheDocument();
    expect(screen.getByText("Cháu")).toBeInTheDocument();
  });

  it("dùng video làm lựa chọn cho bài chọn ký hiệu", () => {
    render(
      <ExerciseRenderer
        exercise={{ ...baseExercise, type: "MEANING_TO_SIGN" }}
        selectedOptionId={null}
        typedAnswer=""
        onSelectOption={vi.fn()}
        onTypeAnswer={vi.fn()}
        disabled={false}
      />,
    );

    expect(screen.getAllByTestId("sign-video")).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: "Chọn ký hiệu này" })).toHaveLength(2);
  });
});
