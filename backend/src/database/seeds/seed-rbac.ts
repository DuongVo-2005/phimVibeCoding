import { NestFactory } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UserRole } from '../../common/constants';
import { Permission, PermissionDocument } from '../../permissions/schemas/permission.schema';
import { RolePermission, RolePermissionDocument } from '../../role-permissions/schemas/role-permission.schema';
import { Role, RoleDocument } from '../../roles/schemas/role.schema';
import { User, UserDocument } from '../../users/schemas/user.schema';
import { SeedRbacModule } from './seed-rbac.module';

interface PermissionSeed {
  key: string;
  description: string;
  grantToUser: boolean;
}

/** Danh mục permission đầy đủ theo api_design.md §2.3 — bao gồm cả các resource chưa có module
 * (categories/countries/directors/notifications/dashboard/uploads) để các phase sau chỉ cần
 * dùng @RequirePermission() mà không phải sửa lại seed này. */
const PERMISSION_CATALOG: PermissionSeed[] = [
  { key: 'films:read', description: 'Xem danh sách/chi tiết phim', grantToUser: true },
  { key: 'films:create', description: 'Tạo phim mới', grantToUser: false },
  { key: 'films:update', description: 'Sửa phim / quản lý tập phim', grantToUser: false },
  { key: 'films:delete', description: 'Xoá phim', grantToUser: false },

  { key: 'categories:read', description: 'Xem danh sách thể loại', grantToUser: true },
  { key: 'categories:create', description: 'Tạo thể loại', grantToUser: false },
  { key: 'categories:update', description: 'Sửa thể loại', grantToUser: false },
  { key: 'categories:delete', description: 'Xoá thể loại', grantToUser: false },
  { key: 'categories:sync', description: 'Đồng bộ thể loại từ Ophim, xem lịch sử đồng bộ', grantToUser: false },

  { key: 'countries:read', description: 'Xem danh sách quốc gia', grantToUser: true },
  { key: 'countries:create', description: 'Tạo quốc gia', grantToUser: false },
  { key: 'countries:update', description: 'Sửa quốc gia', grantToUser: false },
  { key: 'countries:delete', description: 'Xoá quốc gia', grantToUser: false },

  { key: 'directors:read', description: 'Xem danh sách đạo diễn', grantToUser: true },
  { key: 'directors:create', description: 'Tạo đạo diễn', grantToUser: false },
  { key: 'directors:update', description: 'Sửa đạo diễn', grantToUser: false },
  { key: 'directors:delete', description: 'Xoá đạo diễn', grantToUser: false },

  { key: 'actors:read', description: 'Xem danh sách diễn viên', grantToUser: true },
  { key: 'actors:create', description: 'Tạo diễn viên', grantToUser: false },
  { key: 'actors:update', description: 'Sửa diễn viên', grantToUser: false },
  { key: 'actors:delete', description: 'Xoá diễn viên', grantToUser: false },

  { key: 'comments:create', description: 'Đăng bình luận/trả lời', grantToUser: true },
  { key: 'comments:update', description: 'Sửa bình luận của chính mình', grantToUser: true },
  { key: 'comments:vote', description: 'Vote bình luận', grantToUser: true },
  { key: 'comments:delete', description: 'Xoá bình luận của chính mình', grantToUser: true },
  {
    key: 'comments:moderate',
    description: 'Xem/xoá/ẩn bất kỳ bình luận nào (kiểm duyệt)',
    grantToUser: false,
  },

  { key: 'ratings:create', description: 'Đánh giá phim', grantToUser: true },
  { key: 'ratings:delete', description: 'Xoá đánh giá của chính mình', grantToUser: true },

  { key: 'favorites:create', description: 'Thêm yêu thích', grantToUser: true },
  { key: 'favorites:delete', description: 'Bỏ yêu thích', grantToUser: true },

  { key: 'histories:create', description: 'Cập nhật lịch sử xem', grantToUser: true },
  { key: 'histories:delete', description: 'Xoá lịch sử xem', grantToUser: true },

  { key: 'playlists:create', description: 'Tạo danh mục phim', grantToUser: true },
  { key: 'playlists:update', description: 'Sửa danh mục / thêm-xoá phim trong danh mục', grantToUser: true },
  { key: 'playlists:delete', description: 'Xoá danh mục', grantToUser: true },

  { key: 'film-reports:create', description: 'Báo lỗi phim', grantToUser: true },
  { key: 'film-reports:read', description: 'Xem danh sách báo lỗi', grantToUser: false },
  { key: 'film-reports:update', description: 'Cập nhật trạng thái báo lỗi', grantToUser: false },
  { key: 'film-reports:delete', description: 'Xoá báo lỗi', grantToUser: false },

  { key: 'avatars:manage', description: 'Quản lý type/img avatar', grantToUser: false },

  { key: 'notifications:read', description: 'Xem thông báo của chính mình', grantToUser: true },
  {
    key: 'notifications:manage',
    description: 'Đánh dấu đã đọc / xoá thông báo của chính mình',
    grantToUser: true,
  },
  { key: 'notifications:broadcast', description: 'Gửi thông báo hệ thống', grantToUser: false },

  { key: 'crawler:run', description: 'Chạy crawl toàn bộ danh sách phim', grantToUser: false },
  { key: 'crawler:sync', description: 'Chạy crawl 1 nguồn cụ thể (phim đơn/thể loại)', grantToUser: false },
  { key: 'crawler-history:read', description: 'Xem lịch sử crawl', grantToUser: false },

  { key: 'users:read', description: 'Xem danh sách/chi tiết người dùng', grantToUser: false },
  { key: 'users:update', description: 'Sửa hồ sơ (chính mình hoặc bất kỳ)', grantToUser: true },
  {
    key: 'users:manage',
    description: 'Tạo tài khoản, đổi role/trạng thái, gán role, xoá người dùng',
    grantToUser: false,
  },

  { key: 'roles:manage', description: 'Quản lý role và gán permission cho role', grantToUser: false },
  { key: 'permissions:manage', description: 'Quản lý permission', grantToUser: false },

  { key: 'dashboard:view', description: 'Xem dashboard quản trị', grantToUser: false },

  { key: 'uploads:create', description: 'Upload asset', grantToUser: false },
  { key: 'uploads:delete', description: 'Xoá asset đã upload', grantToUser: false },
];

async function ensurePermissions(
  permissionModel: Model<PermissionDocument>,
): Promise<Map<string, string>> {
  const permissionIdByKey = new Map<string, string>();
  let created = 0;

  for (const item of PERMISSION_CATALOG) {
    const [resource, action] = item.key.split(':');
    let permission = await permissionModel.findOne({ key: item.key }).exec();
    if (!permission) {
      permission = await permissionModel.create({
        key: item.key,
        resource,
        action,
        description: item.description,
      });
      created++;
    }
    permissionIdByKey.set(item.key, permission.id);
  }

  console.log(`Permissions: ${permissionIdByKey.size} tổng cộng (${created} mới tạo)`);
  return permissionIdByKey;
}

async function ensureRole(
  roleModel: Model<RoleDocument>,
  name: string,
  description: string,
): Promise<RoleDocument> {
  let role = await roleModel.findOne({ name }).exec();
  if (!role) {
    role = await roleModel.create({ name, description, isSystem: true });
    console.log(`+ role: ${name}`);
  }
  return role;
}

async function syncRolePermissions(
  rolePermissionModel: Model<RolePermissionDocument>,
  roleId: string,
  permissionIds: string[],
): Promise<void> {
  await rolePermissionModel.deleteMany({ role: roleId }).exec();
  if (permissionIds.length > 0) {
    // insertMany() không tự cast string -> ObjectId — ép kiểu tường minh (xem role-permissions.service.ts).
    await rolePermissionModel.insertMany(
      permissionIds.map((permission) => ({
        role: new Types.ObjectId(roleId),
        permission: new Types.ObjectId(permission),
      })),
    );
  }
}

async function backfillUserRoleIds(
  userModel: Model<UserDocument>,
  roleIdByLegacyRole: Record<string, string>,
  fallbackRoleId: string,
): Promise<void> {
  const usersMissingRoleIds = await userModel
    .find({ $or: [{ roleIds: { $exists: false } }, { roleIds: { $size: 0 } }] })
    .exec();

  for (const user of usersMissingRoleIds) {
    const defaultRoleId = roleIdByLegacyRole[user.role] ?? fallbackRoleId;
    user.roleIds = [new Types.ObjectId(defaultRoleId)];
    await user.save();
  }

  console.log(
    usersMissingRoleIds.length > 0
      ? `Đã gán roleIds cho ${usersMissingRoleIds.length} user hiện có (theo role hệ thống cũ)`
      : 'Không có user nào cần backfill roleIds',
  );
}

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(SeedRbacModule);

  try {
    const permissionModel = app.get<Model<PermissionDocument>>(getModelToken(Permission.name));
    const roleModel = app.get<Model<RoleDocument>>(getModelToken(Role.name));
    const rolePermissionModel = app.get<Model<RolePermissionDocument>>(
      getModelToken(RolePermission.name),
    );
    const userModel = app.get<Model<UserDocument>>(getModelToken(User.name));

    const permissionIdByKey = await ensurePermissions(permissionModel);

    const adminRole = await ensureRole(roleModel, UserRole.ADMIN, 'Quản trị viên hệ thống');
    const userRole = await ensureRole(roleModel, UserRole.USER, 'Người dùng thông thường');

    const allPermissionIds = Array.from(permissionIdByKey.values());
    const userPermissionIds = PERMISSION_CATALOG.filter((item) => item.grantToUser).map(
      (item) => permissionIdByKey.get(item.key)!,
    );

    await syncRolePermissions(rolePermissionModel, adminRole.id, allPermissionIds);
    await syncRolePermissions(rolePermissionModel, userRole.id, userPermissionIds);
    console.log(
      `Đã đồng bộ ${allPermissionIds.length} permission cho role "admin", ` +
        `${userPermissionIds.length} permission cho role "user"`,
    );

    await backfillUserRoleIds(
      userModel,
      { [UserRole.ADMIN]: adminRole.id, [UserRole.USER]: userRole.id },
      userRole.id,
    );
  } finally {
    await app.close();
  }
}

bootstrap();
