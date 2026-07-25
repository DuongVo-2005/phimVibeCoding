/**
 * Khớp `actors/schemas/actor.schema.ts` thật (Phase 11.0 audit — `name,slug,avatar,bio,birthday,
 * nationality`). KHÔNG có filmography, KHÔNG có số phim đã đóng — `GET /actors/:slug` không
 * populate phim, không có endpoint "phim theo diễn viên" nào (đã xác nhận Phase 11.0, quyết định
 * B: tích hợp Actor Profile BLOCKED cho tới khi backend bổ sung). KHÔNG tự thêm field nào ngoài
 * những gì schema thật có.
 *
 * `ActorSummary`/`ActorDetail` tách riêng theo đúng cấu trúc domain đã yêu cầu, dù `GET /actors`
 * (danh sách) và `GET /actors/:slug` (chi tiết) nhiều khả năng trả cùng 1 shape đầy đủ (Mongoose
 * không tự cắt field trừ khi controller dùng `.select()` — không có bằng chứng nào cho thấy có
 * cắt field ở danh sách). `ActorDetail extends ActorSummary` nên phần dư thừa (nếu có) ở phía
 * danh sách vẫn an toàn về kiểu (structural typing — thừa field không gây lỗi).
 */
export interface ActorRef {
  _id: string;
  name: string;
  slug: string;
  avatar?: string;
}

export interface ActorSummary {
  _id: string;
  name: string;
  slug: string;
  avatar?: string;
  nationality?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ActorDetail extends ActorSummary {
  bio?: string;
  birthday?: string;
}

export interface CreateActorInput {
  name: string;
  avatar?: string;
  bio?: string;
  birthday?: string;
  nationality?: string;
}

export type UpdateActorInput = Partial<CreateActorInput>;
