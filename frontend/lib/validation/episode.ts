import { z } from 'zod';

const optionalUrlOrEmpty = z.string().trim().optional().or(z.literal(''));

/**
 * Schema form Add/Edit tập phim (Phase 35) — khớp `CreateEpisodeDto`/`UpdateEpisodeDto` thật
 * (backend/src/episodes/dto/*.dto.ts). KHÔNG có field `displayOrder` — chỉ đổi qua thao tác sắp
 * xếp riêng (nút lên/xuống gọi `useUpdateEpisodeOrderMutation`), không qua form này. Giống
 * `filmFormSchema`: KHÔNG validate định dạng URL ở frontend (backend đã validate `@IsUrl`) — chỉ
 * trim/optional, tránh trùng lặp rule và lệch thông báo lỗi giữa 2 tầng.
 */
export const episodeFormSchema = z.object({
  // `valueAsNumber: true` ở `register('episodeNumber', ...)` (EpisodeFormDialog) đã ép giá trị
  // input về number trước khi vào đây — dùng `z.number()` thường (KHÔNG `z.coerce`) để input/output
  // type của schema trùng nhau, tránh lỗi generic mismatch giữa `useForm<EpisodeFormValues>` và
  // `zodResolver` (input `unknown`/`string` vs output `number`).
  episodeNumber: z
    .number({ message: 'Vui lòng nhập số tập' })
    .int('Số tập phải là số nguyên')
    .min(1, 'Số tập phải lớn hơn hoặc bằng 1'),
  title: z.string().trim().min(1, 'Vui lòng nhập tên tập'),
  embedUrl: optionalUrlOrEmpty,
  m3u8Url: optionalUrlOrEmpty,
  subtitleUrl: optionalUrlOrEmpty,
  duration: z.string().trim().optional(),
  isPublished: z.boolean(),
});

export type EpisodeFormValues = z.infer<typeof episodeFormSchema>;

export const EPISODE_FORM_DEFAULTS: EpisodeFormValues = {
  episodeNumber: 1,
  title: '',
  embedUrl: '',
  m3u8Url: '',
  subtitleUrl: '',
  duration: '',
  isPublished: true,
};
