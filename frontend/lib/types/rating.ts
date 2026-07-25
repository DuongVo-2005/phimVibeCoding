/**
 * Khớp `ratings/schemas/rating.schema.ts` thật (Phase 11.0 audit) — `film,user,score(1-10)`.
 * `RatingSummary` (endpoint tổng hợp `GET /ratings/film/:filmId`) trả `{average,count}` — KHÁC
 * hẳn `Rating` (1 bản ghi của 1 user) — 2 shape này không được gộp (đã ghi trong audit mục 6).
 * Lưu ý: `api_design.md` ghi field là `avg` — SAI, mã nguồn thật dùng `average`.
 */
export interface Rating {
  _id: string;
  film: string;
  user: string;
  score: number;
  createdAt: string;
  updatedAt: string;
}

export interface RatingSummary {
  average: number;
  count: number;
}

export interface CreateRatingInput {
  score: number;
}
