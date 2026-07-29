/**
 * Khớp `directors/schemas/director.schema.ts` thật (Phase 11.0 audit — cùng shape `actors`:
 * `name,slug,avatar,bio,birthday,nationality`).
 *
 * Phase 19B.2 (Admin Movie Create/Edit): thêm `Director`/`CreateDirectorInput`/
 * `UpdateDirectorInput` — cần cho ô chọn đạo diễn (search + multi-select) và sẽ dùng lại nguyên
 * vẹn ở phase Director Management sau này (`directors.controller.ts` đã có đủ CRUD từ trước, chỉ
 * chưa có client). `DirectorRef` giữ nguyên — vẫn là shape populate rút gọn dùng ở `FilmSummary`.
 */
export interface DirectorRef {
  _id: string;
  name: string;
  slug: string;
}

export interface DirectorSummary extends DirectorRef {
  avatar?: string;
  nationality?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DirectorDetail extends DirectorSummary {
  bio?: string;
  birthday?: string;
}

export interface CreateDirectorInput {
  name: string;
  avatar?: string;
  bio?: string;
  birthday?: string;
  nationality?: string;
}

export type UpdateDirectorInput = Partial<CreateDirectorInput>;
