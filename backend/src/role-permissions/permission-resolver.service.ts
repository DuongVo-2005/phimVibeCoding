import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../users/schemas/user.schema';
import { RolePermissionsService } from './role-permissions.service';

const CACHE_TTL_MS = 60_000;

interface CacheEntry {
  keys: Set<string>;
  expiresAt: number;
}

/**
 * Resolve userId -> roleIds -> role_permissions -> permission keys, dùng bởi PermissionsGuard.
 * Cache trong bộ nhớ theo user, TTL ngắn (60s) để tránh join lại trên mỗi request — chấp nhận
 * độ trễ nhất quán trong TTL đó, ngoại trừ khi user vừa bị đổi role (xem `invalidate`).
 */
@Injectable()
export class PermissionResolverService {
  private readonly cache = new Map<string, CacheEntry>();

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly rolePermissionsService: RolePermissionsService,
  ) {}

  async getPermissionKeysForUser(userId: string): Promise<Set<string>> {
    const cached = this.cache.get(userId);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.keys;
    }

    const user = await this.userModel.findById(userId).select('roleIds').exec();
    const roleIds = user?.roleIds ?? [];
    const keys = new Set(
      roleIds.length > 0
        ? await this.rolePermissionsService.findPermissionKeysForRoles(roleIds)
        : [],
    );

    this.cache.set(userId, { keys, expiresAt: Date.now() + CACHE_TTL_MS });
    return keys;
  }

  /** Xoá cache của 1 user ngay khi roleIds của họ thay đổi, để có hiệu lực tức thì. */
  invalidate(userId: string): void {
    this.cache.delete(userId);
  }
}
