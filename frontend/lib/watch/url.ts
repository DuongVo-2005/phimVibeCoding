/**
 * Phase 13A: helper dựng URL trang xem phim theo kiến trúc đã chốt ở Phase 13 —
 * `/xem-phim/[slug]` giữ nguyên, bổ sung query `?ep=<episodeSlug>&server=<serverIndex>` (KHÔNG
 * đổi sang `/xem-phim/[slug]/[episode]`). Dùng chung để tránh hardcode chuỗi URL rải rác trong
 * component.
 */
export function buildWatchUrl(
  filmSlug: string,
  episodeSlug?: string,
  serverIndex?: number,
): string {
  const params = new URLSearchParams();

  if (episodeSlug !== undefined) {
    params.set('ep', episodeSlug);
  }
  if (serverIndex !== undefined) {
    params.set('server', String(serverIndex));
  }

  const query = params.toString();
  return query ? `/xem-phim/${filmSlug}?${query}` : `/xem-phim/${filmSlug}`;
}
