export interface NormalizedListPage<T> {
  items: T[];
  totalPages: number;
  totalElements: number;
  currentPage: number;
}

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as UnknownRecord)
    : null;
}

function asNonNegativeInteger(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, Math.trunc(value))
    : fallback;
}

/**
 * Normalizes list responses across rolling deployments.
 *
 * Supported shapes:
 * - the legacy array response;
 * - SignLight's `{ items, totalPages, ... }` response;
 * - Spring Data's `{ content, totalPages, number, ... }` response;
 * - an `items` field containing a Spring Data page.
 */
export function normalizeListPage<T>(
  payload: unknown,
  fallbackPage = 0,
): NormalizedListPage<T> {
  if (Array.isArray(payload)) {
    return {
      items: payload as T[],
      totalPages: 1,
      totalElements: payload.length,
      currentPage: fallbackPage,
    };
  }

  const response = asRecord(payload);
  if (!response) {
    return { items: [], totalPages: 1, totalElements: 0, currentPage: fallbackPage };
  }

  const nestedItemsPage = asRecord(response.items);
  const items = Array.isArray(response.items)
    ? (response.items as T[])
    : Array.isArray(response.content)
      ? (response.content as T[])
      : Array.isArray(nestedItemsPage?.content)
        ? (nestedItemsPage.content as T[])
        : [];

  const metadata = nestedItemsPage && Array.isArray(nestedItemsPage.content)
    ? nestedItemsPage
    : response;
  const currentPage = asNonNegativeInteger(
    metadata.currentPage ?? metadata.number,
    fallbackPage,
  );
  const totalElements = asNonNegativeInteger(metadata.totalElements, items.length);
  const totalPages = Math.max(1, asNonNegativeInteger(metadata.totalPages, 1));

  return { items, totalPages, totalElements, currentPage };
}
