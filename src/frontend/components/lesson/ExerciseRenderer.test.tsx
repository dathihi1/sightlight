import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

  it("ẩn phần nghĩa khỏi câu hỏi bài học", () => {
    render(
      <ExerciseRenderer
        exercise={{ ...baseExercise, type: "SIGN_TO_MEANING", promptText: "Ký hiệu này là gì? (Nghĩa: người nam lớn tuổi hơn)" }}
        selectedOptionId={null}
        typedAnswer=""
        onSelectOption={vi.fn()}
        onTypeAnswer={vi.fn()}
        disabled={false}
      />,
    );

    expect(screen.getByText("Ký hiệu này là gì?")).toBeInTheDocument();
    expect(screen.queryByText(/người nam lớn tuổi hơn/i)).not.toBeInTheDocument();
  });

  it("chỉ hiện gợi ý sau khi người học bấm nút", async () => {
    const user = userEvent.setup();
    render(
      <ExerciseRenderer
        exercise={{ ...baseExercise, type: "SIGN_TO_MEANING", promptText: "Ký hiệu này là gì? (Gợi ý nghĩa: người trong gia đình)" }}
        selectedOptionId={null}
        typedAnswer=""
        onSelectOption={vi.fn()}
        onTypeAnswer={vi.fn()}
        disabled={false}
      />,
    );

    expect(screen.queryByText("người trong gia đình")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Gợi ý" }));
    expect(screen.getByText("người trong gia đình")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ẩn gợi ý" })).toHaveAttribute("aria-expanded", "true");
  });
});
