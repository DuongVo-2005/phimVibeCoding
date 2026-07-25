/**
 * Toàn bộ query param đã xác nhận qua các Query DTO backend (Phase 9.2 audit: films, actors,
 * categories, comments, favorites, users) đều là giá trị vô hướng (string/number/boolean) —
 * không có param dạng mảng/object lồng nhau — nên chỉ cần URLSearchParams đơn giản, không cần
 * quy ước serialize mảng (comma-separated, repeat key...).
 */
export type QueryParams = Record<string, string | number | boolean | undefined | null>;

export function buildQueryString(params?: QueryParams): string {
  if (!params) {
    return '';
  }

  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) {
      continue;
    }
    search.set(key, String(value));
  }

  const qs = search.toString();
  return qs ? `?${qs}` : '';
}
