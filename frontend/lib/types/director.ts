/**
 * Khớp `directors/schemas/director.schema.ts` thật (Phase 11.0 audit — cùng shape `actors`:
 * `name,slug,avatar,bio,birthday,nationality`). Chỉ khai `DirectorRef` — `FilmSummary`/
 * `FilmDetail` cần field này để populate `directors[]`; `directorsApi` KHÔNG được tạo ở Phase
 * 11.2 (nhóm C trong audit — không có UI nào dùng ở 7 màn hình hiện tại), nên chưa cần `Director`
 * đầy đủ (tránh khai type không có nơi dùng).
 */
export interface DirectorRef {
  _id: string;
  name: string;
  slug: string;
}
