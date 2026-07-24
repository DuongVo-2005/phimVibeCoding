import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PaginatedResponseDto } from '../common/dto/paginated-response.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { Permission, PermissionDocument } from '../permissions/schemas/permission.schema';
import { RolePermissionsService } from '../role-permissions/role-permissions.service';
import { User, UserDocument } from '../users/schemas/user.schema';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { Role, RoleDocument } from './schemas/role.schema';

export const ADMIN_ROLE_NAME = 'admin';
export const USER_ROLE_NAME = 'user';

@Injectable()
export class RolesService {
  constructor(
    @InjectModel(Role.name) private readonly roleModel: Model<RoleDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Permission.name) private readonly permissionModel: Model<PermissionDocument>,
    private readonly rolePermissionsService: RolePermissionsService,
  ) {}

  async create(dto: CreateRoleDto): Promise<RoleDocument> {
    const existing = await this.roleModel.findOne({ name: dto.name }).exec();
    if (existing) {
      throw new ConflictException('Role đã tồn tại');
    }
    return this.roleModel.create({ name: dto.name, description: dto.description ?? '' });
  }

  findAll(): Promise<RoleDocument[]> {
    return this.roleModel.find().sort({ name: 1 }).exec();
  }

  async findOne(id: string): Promise<RoleDocument & { permissionKeys: string[] }> {
    const role = await this.getOrThrow(id);
    const permissionKeys = await this.rolePermissionsService.findPermissionKeysForRoles([role._id]);
    return Object.assign(role.toObject(), { permissionKeys });
  }

  async update(id: string, dto: UpdateRoleDto): Promise<RoleDocument> {
    const role = await this.getOrThrow(id);

    if (role.isSystem && dto.name && dto.name !== role.name) {
      throw new ConflictException('Không thể đổi tên role hệ thống');
    }

    Object.assign(role, dto);
    return role.save();
  }

  async remove(id: string): Promise<void> {
    const role = await this.getOrThrow(id);

    if (role.isSystem) {
      throw new ConflictException('Không thể xoá role hệ thống');
    }

    const usersWithRole = await this.userModel.countDocuments({ roleIds: role._id }).exec();
    if (usersWithRole > 0) {
      throw new ConflictException(
        `Không thể xoá — đang được sử dụng bởi ${usersWithRole} người dùng`,
      );
    }

    await this.roleModel.findByIdAndDelete(id).exec();
    await this.rolePermissionsService.removeAllForRole(id);
  }

  async findPermissions(id: string): Promise<PermissionDocument[]> {
    await this.getOrThrow(id);
    return this.rolePermissionsService.findPermissionsForRole(id);
  }

  async setPermissions(id: string, permissionIds: string[]): Promise<PermissionDocument[]> {
    const role = await this.getOrThrow(id);

    if (role.name === ADMIN_ROLE_NAME && permissionIds.length === 0) {
      throw new ConflictException('Không thể xoá hết permission của role admin');
    }

    if (permissionIds.length > 0) {
      const validCount = await this.permissionModel
        .countDocuments({ _id: { $in: permissionIds } })
        .exec();
      if (validCount !== permissionIds.length) {
        throw new NotFoundException('Một hoặc nhiều permission không tồn tại');
      }
    }

    await this.rolePermissionsService.setForRole(id, permissionIds);
    return this.rolePermissionsService.findPermissionsForRole(id);
  }

  async findUsers(
    id: string,
    query: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<UserDocument>> {
    await this.getOrThrow(id);

    const filter = { roleIds: id };
    const [items, totalItems] = await Promise.all([
      this.userModel.find(filter).skip(query.skip).limit(query.limit).exec(),
      this.userModel.countDocuments(filter).exec(),
    ]);

    return new PaginatedResponseDto(items, totalItems, query.page, query.limit);
  }

  findByName(name: string): Promise<RoleDocument | null> {
    return this.roleModel.findOne({ name }).exec();
  }

  findManyByIds(ids: string[]): Promise<RoleDocument[]> {
    return this.roleModel.find({ _id: { $in: ids } }).exec();
  }

  private async getOrThrow(id: string): Promise<RoleDocument> {
    const role = await this.roleModel.findById(id).exec();
    if (!role) {
      throw new NotFoundException('Không tìm thấy role');
    }
    return role;
  }
}
