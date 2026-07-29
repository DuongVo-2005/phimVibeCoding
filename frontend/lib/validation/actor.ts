import { z } from 'zod';

/** Khớp `CreateActorDto`/`UpdateActorDto` thật (backend/src/actors/dto/*.dto.ts). `birthday` dùng
 * `<input type="date">` (chuỗi "YYYY-MM-DD") — khớp đúng `@IsDateString()` backend. */
export const actorFormSchema = z.object({
  name: z.string().trim().min(1, 'Vui lòng nhập tên diễn viên'),
  avatar: z.string().trim().optional(),
  bio: z.string().trim().optional(),
  birthday: z.string().trim().optional(),
  nationality: z.string().trim().optional(),
});

export type ActorFormValues = z.infer<typeof actorFormSchema>;

export const ACTOR_FORM_DEFAULTS: ActorFormValues = {
  name: '',
  avatar: '',
  bio: '',
  birthday: '',
  nationality: '',
};
