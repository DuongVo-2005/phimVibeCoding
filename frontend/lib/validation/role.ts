import { z } from 'zod';

/** Khớp `CreateRoleDto` thật (backend/src/roles/dto/create-role.dto.ts). */
export const roleFormSchema = z.object({
  name: z.string().trim().min(1, 'Vui lòng nhập tên role').max(50, 'Tối đa 50 ký tự'),
  description: z.string().trim().max(255, 'Tối đa 255 ký tự').optional(),
});

export type RoleFormValues = z.infer<typeof roleFormSchema>;
