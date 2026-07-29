import { z } from 'zod';

/** Khớp `CreateDirectorDto`/`UpdateDirectorDto` thật (backend/src/directors/dto/*.dto.ts) — cùng
 * shape `actors` hệt nhau (name/avatar/bio/birthday/nationality). */
export const directorFormSchema = z.object({
  name: z.string().trim().min(1, 'Vui lòng nhập tên đạo diễn'),
  avatar: z.string().trim().optional(),
  bio: z.string().trim().optional(),
  birthday: z.string().trim().optional(),
  nationality: z.string().trim().optional(),
});

export type DirectorFormValues = z.infer<typeof directorFormSchema>;

export const DIRECTOR_FORM_DEFAULTS: DirectorFormValues = {
  name: '',
  avatar: '',
  bio: '',
  birthday: '',
  nationality: '',
};
