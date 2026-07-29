import { z } from 'zod';

const optionalUrlOrEmpty = z.string().trim().optional().or(z.literal(''));

/**
 * Schema form Create/Edit phim (Phase 19B.2) — khớp đúng `CreateFilmDto`/`UpdateFilmDto` thật
 * (backend/src/films/dto/*.dto.ts, audit Phase 19B). KHÔNG có field `episodes` — `UpdateFilmDto`
 * loại hẳn field này (`OmitType(CreateFilmDto, ['episodes'])`), và "Episode Management" là phase
 * riêng theo đúng roadmap đã chốt — tránh xây nửa vời rồi phải thiết kế lại. Backend chỉ có
 * `@IsString()`/`@IsOptional()` cho các field text (không giới hạn độ dài) nên KHÔNG tự đặt thêm
 * ràng buộc `max()` không có căn cứ — chỉ `title` bắt buộc (đúng `@IsString()` không optional).
 */
export const filmFormSchema = z.object({
  title: z.string().trim().min(1, 'Vui lòng nhập tên phim'),
  originalTitle: z.string().trim().optional(),
  description: z.string().trim().optional(),
  posterUrl: optionalUrlOrEmpty,
  thumbUrl: optionalUrlOrEmpty,
  trailerUrl: optionalUrlOrEmpty,
  category: z.enum(['single', 'series']),
  episodeCurrent: z.string().trim().optional(),
  episodeTotal: z.string().trim().optional(),
  duration: z.string().trim().optional(),
  quality: z.string().trim().optional(),
  language: z.string().trim().optional(),
  releaseYear: z
    .string()
    .trim()
    .optional()
    .refine((value) => !value || /^\d{4}$/.test(value), 'Năm phải gồm 4 chữ số'),
  status: z.enum(['ongoing', 'completed']),
  isPublished: z.boolean(),
  countries: z.array(z.object({ _id: z.string(), name: z.string() })),
  directors: z.array(z.object({ _id: z.string(), name: z.string() })),
  actors: z.array(z.object({ _id: z.string(), name: z.string() })),
  categories: z.array(z.object({ _id: z.string(), name: z.string() })),
});

export type FilmFormValues = z.infer<typeof filmFormSchema>;

export const FILM_FORM_DEFAULTS: FilmFormValues = {
  title: '',
  originalTitle: '',
  description: '',
  posterUrl: '',
  thumbUrl: '',
  trailerUrl: '',
  category: 'single',
  episodeCurrent: '',
  episodeTotal: '',
  duration: '',
  quality: '',
  language: '',
  releaseYear: '',
  status: 'ongoing',
  isPublished: true,
  countries: [],
  directors: [],
  actors: [],
  categories: [],
};
