import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PermissionDocument } from '../permissions/schemas/permission.schema';
import { RolePermission, RolePermissionDocument } from './schemas/role-permission.schema';

@Injectable()
export class RolePermissionsService {
  constructor(
    @InjectModel(RolePermission.name)
    private readonly rolePermissionModel: Model<RolePermissionDocument>,
  ) {}

  /**
   * Thay thế toàn bộ tập permission của 1 role (không cộng dồn).
   *
   * Ép kiểu tường minh sang ObjectId ở MỌI query trong service này — không dựa vào cast ngầm
   * của Mongoose cho `insertMany`/`find` với giá trị string, để tránh lệch kiểu string vs
   * ObjectId khi so khớp bằng `$in` với `user.roleIds` (vốn luôn là ObjectId thật).
   */
  async setForRole(roleId: string, permissionIds: string[]): Promise<void> {
    const roleObjectId = new Types.ObjectId(roleId);
    await this.rolePermissionModel.deleteMany({ role: roleObjectId }).exec();
    if (permissionIds.length === 0) {
      return;
    }
    await this.rolePermissionModel.insertMany(
      permissionIds.map((permission) => ({
        role: roleObjectId,
        permission: new Types.ObjectId(permission),
      })),
    );
  }

  async findPermissionsForRole(roleId: string): Promise<PermissionDocument[]> {
    const rows = await this.rolePermissionModel
      .find({ role: new Types.ObjectId(roleId) })
      .populate<{ permission: PermissionDocument }>('permission')
      .exec();
    return rows.map((row) => row.permission).filter(Boolean);
  }

  async findPermissionKeysForRoles(roleIds: (Types.ObjectId | string)[]): Promise<string[]> {
    if (roleIds.length === 0) {
      return [];
    }
    const objectIds = roleIds.map((id) => new Types.ObjectId(id));
    const rows = await this.rolePermissionModel
      .find({ role: { $in: objectIds } })
      .populate<{ permission: PermissionDocument }>('permission', 'key')
      .exec();
    return rows.map((row) => row.permission?.key).filter((key): key is string => !!key);
  }

  async removeAllForRole(roleId: string): Promise<void> {
    await this.rolePermissionModel.deleteMany({ role: new Types.ObjectId(roleId) }).exec();
  }

  async removeAllForPermission(permissionId: string): Promise<void> {
    await this.rolePermissionModel
      .deleteMany({ permission: new Types.ObjectId(permissionId) })
      .exec();
  }
}
