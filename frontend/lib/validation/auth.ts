import { z } from 'zod';

/**
 * Schema validate form đăng nhập/đăng ký (Phase 11.1) — form thật đầu tiên của dự án dùng
 * `react-hook-form` + `zod` (đã có trong package.json từ đầu theo frontend.md §2, chưa từng dùng).
 * Ràng buộc `password` tối thiểu 8 ký tự khớp đúng `RegisterDto`/`LoginDto` thật ở backend
 * (Phase 11.0 audit) — không suy đoán thêm ràng buộc nào khác ngoài những gì backend đã xác nhận.
 */
export const loginSchema = z.object({
  email: z.string().min(1, 'Vui lòng nhập email').email('Email không hợp lệ'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    name: z.string().trim().max(100, 'Tên tối đa 100 ký tự').optional(),
    email: z.string().min(1, 'Vui lòng nhập email').email('Email không hợp lệ'),
    password: z.string().min(8, 'Mật khẩu tối thiểu 8 ký tự'),
    confirmPassword: z.string().min(1, 'Vui lòng xác nhận mật khẩu'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
  });

export type RegisterFormValues = z.infer<typeof registerSchema>;
