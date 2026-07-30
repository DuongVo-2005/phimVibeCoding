export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

export enum FilmCategory {
  SINGLE = 'single',
  SERIES = 'series',
}

export enum FilmStatus {
  ONGOING = 'ongoing',
  COMPLETED = 'completed',
}

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
}

export enum VoteType {
  UP = 'up',
  DOWN = 'down',
}

export enum FavoriteTargetType {
  FILM = 'film',
  ACTOR = 'actor',
}

export enum FilmReportStatus {
  PENDING = 'pending',
  RESOLVED = 'resolved',
}

export enum CrawlerRunStatus {
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  PARTIAL_SUCCESS = 'PARTIAL_SUCCESS',
}

/** Phase 31 (Upload Module): `purpose` trong `POST /uploads/image` (api_design.md §24) — dùng để
 * tổ chức file theo thư mục con (`uploads/<purpose>/...`). Chỉ gồm các nơi THẬT SỰ cần ảnh trong
 * dự án hiện tại (`Film.posterUrl`/`thumbUrl`, `Actor`/`Director.avatar`, `ImgAvatar.url`) —
 * `Film.trailerUrl` là link video/embed, không phải ảnh, không thuộc phạm vi endpoint này. */
export enum UploadPurpose {
  POSTER = 'poster',
  THUMBNAIL = 'thumbnail',
  AVATAR = 'avatar',
}

/** Phase 34 (Notification Center) — 4 loại tối thiểu theo yêu cầu. `SYSTEM` dùng cho thông báo
 * chung/nội bộ (không gắn nguồn cụ thể); `COMMENT`/`FAVORITE`/`ACCOUNT` dành cho phase sau khi có
 * trigger thật (vd. có người trả lời bình luận, phim yêu thích có tập mới, tài khoản bị đổi trạng
 * thái) — module này chỉ dựng lớp lưu trữ/đọc/quản lý, CHƯA nối trigger tự động ở module khác
 * (ngoài phạm vi yêu cầu Phase 34 — không có endpoint tạo thông báo nào được yêu cầu). */
export enum NotificationType {
  SYSTEM = 'system',
  COMMENT = 'comment',
  FAVORITE = 'favorite',
  ACCOUNT = 'account',
}

export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_LIMIT = 20;
export const MAX_PAGE_LIMIT = 100;

export const IS_PUBLIC_KEY = 'isPublic';
export const ROLES_KEY = 'roles';
export const PERMISSION_KEY = 'permission';
