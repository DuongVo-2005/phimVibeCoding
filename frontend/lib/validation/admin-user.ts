import { z } from 'zod';

/** Khớp `CreateUserByAdminDto` thật (backend/src/users/dto/create-user-by-admin.dto.ts). Tên file
 * `admin-user.ts` (không phải `user.ts`) — tránh trùng với `lib/validation/auth.ts` vốn đã có
 * `registerSchema` cho form đăng ký công khai (khác luồng, khác ràng buộc mật khẩu tối thiểu tuy
 * cùng 8 ký tự). */
export const createUserByAdminSchema = z.object({
  email: z.string().trim().min(1, 'Vui lòng nhập email').email('Email không hợp lệ'),
  password: z.string().min(8, 'Mật khẩu tối thiểu 8 ký tự'),
  name: z.string().trim().optional(),
});

export type CreateUserByAdminFormValues = z.infer<typeof createUserByAdminSchema>;
