/** Fisher–Yates không làm thay đổi mảng nguồn. Tham số random giúp kiểm thử tất định. */
export function shuffleForDisplay<T>(items: readonly T[], random: () => number = Math.random): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const sample = Math.min(0.999999999, Math.max(0, random()));
    const swapIndex = Math.floor(sample * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}
