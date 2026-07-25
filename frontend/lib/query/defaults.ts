import type { DefaultOptions } from '@tanstack/react-query';

/**
 * Phase 11.3A — nhóm cache theo đặc tính dữ liệu (audit Phase 11.3, mục 5). Dùng làm baseline cho
 * `options.ts` khi viết `queryOptions` thật — CHƯA có nơi nào gọi tới ngoài `client.ts`/
 * `options.ts` trong phase này (không tích hợp UI, đúng phạm vi 11.3A).
 */
const MINUTE = 60 * 1000;

/**
 * Phase 11.3A review: phần cấu hình trung lập về kỹ thuật — KHÔNG mang ý nghĩa domain (không có
 * `staleTime`/`gcTime`, vốn phụ thuộc đặc tính dữ liệu). Từng nhóm cache bên dưới spread cái này
 * rồi override `staleTime`/`gcTime` riêng. Không đặt `refetchOnWindowFocus` — giữ mặc định thư
 * viện (`true`), chưa xác nhận giá trị riêng cho từng nhóm (đã ghi trong audit Phase 11.3, mục 5).
 */
export const BASE_QUERY_OPTIONS = {
  retry: 2,
  refetchOnReconnect: true,
} as const;

/** Dữ liệu gần như tĩnh (categories, countries) — hiếm khi đổi giữa các phiên. */
export const STATIC_QUERY_OPTIONS = {
  ...BASE_QUERY_OPTIONS,
  staleTime: 20 * MINUTE,
  gcTime: 60 * MINUTE,
} as const;

/** Phim/diễn viên public — view/ratingAvg/commentCount đổi liên tục nhưng không cần realtime. */
export const PUBLIC_CONTENT_QUERY_OPTIONS = {
  ...BASE_QUERY_OPTIONS,
  staleTime: 2 * MINUTE,
  gcTime: 15 * MINUTE,
} as const;

/** Bình luận (đọc) — tương tác xã hội, cần tương đối tươi. */
export const SOCIAL_QUERY_OPTIONS = {
  ...BASE_QUERY_OPTIONS,
  staleTime: 45 * 1000,
  gcTime: 5 * MINUTE,
} as const;

/** Dữ liệu cá nhân hoá cần đăng nhập (favorites/histories/playlists/users.me/ratings.mine). */
export const PRIVATE_QUERY_OPTIONS = {
  ...BASE_QUERY_OPTIONS,
  staleTime: 0,
  gcTime: 5 * MINUTE,
} as const;

/**
 * `defaultOptions.queries` của `QueryClient` toàn cục (quyết định 3, sửa lại theo review Phase
 * 11.3A) — dùng `BASE_QUERY_OPTIONS` (trung lập, không mang ý nghĩa domain) thay vì
 * `PUBLIC_CONTENT_QUERY_OPTIONS`. Domain mới chưa được phân loại qua `options.ts` sẽ rơi về
 * `staleTime`/`gcTime` mặc định của thư viện (0 / 5 phút) thay vì vô tình bị coi là "public
 * content". Từng domain hiện có vẫn dùng đúng nhóm cache riêng của mình qua `options.ts` — không
 * đổi hành vi.
 */
export const DEFAULT_QUERY_OPTIONS: DefaultOptions['queries'] = BASE_QUERY_OPTIONS;

/** `defaultOptions.mutations` — retry=0 bắt buộc (quyết định 3): không tự động lặp lại POST/DELETE. */
export const DEFAULT_MUTATION_OPTIONS: DefaultOptions['mutations'] = {
  retry: 0,
};
