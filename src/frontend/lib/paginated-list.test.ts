import { describe, expect, it } from "vitest";
import { normalizeListPage } from "./paginated-list";

describe("normalizeListPage", () => {
  const rows = [{ id: "one" }, { id: "two" }];

  it("accepts the legacy array response", () => {
    expect(normalizeListPage(rows, 2)).toEqual({
      items: rows,
      totalPages: 1,
      totalElements: 2,
      currentPage: 2,
    });
  });

  it("accepts the SignLight paginated response", () => {
    expect(normalizeListPage({
      items: rows,
      totalPages: 4,
      totalElements: 7,
      currentPage: 1,
    })).toEqual({
      items: rows,
      totalPages: 4,
      totalElements: 7,
      currentPage: 1,
    });
  });

  it("accepts Spring Data page responses", () => {
    expect(normalizeListPage({
      content: rows,
      totalPages: 3,
      totalElements: 5,
      number: 2,
    })).toEqual({
      items: rows,
      totalPages: 3,
      totalElements: 5,
      currentPage: 2,
    });
  });

  it("accepts a nested Spring Data page and never exposes a non-array items value", () => {
    expect(normalizeListPage({
      items: { content: rows, totalPages: 2, totalElements: 4, number: 1 },
    })).toEqual({
      items: rows,
      totalPages: 2,
      totalElements: 4,
      currentPage: 1,
    });

    expect(normalizeListPage({ items: { unexpected: true } }).items).toEqual([]);
  });
});
