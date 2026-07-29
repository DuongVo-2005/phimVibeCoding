import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { FilterQuery, Model, Types } from 'mongoose';
import { PaginatedResponseDto } from '../common/dto/paginated-response.dto';
import { escapeRegExp } from '../common/utils/regex-escape.util';
import { PermissionResolverService } from '../role-permissions/permission-resolver.service';
import { RoleDocument } from '../roles/schemas/role.schema';
import { RolesService, USER_ROLE_NAME } from '../roles/roles.service';
import { CreateUserByAdminDto } from './dto/create-user-by-admin.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { SetUserRolesDto } from './dto/set-user-roles.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { User, UserDocument } from './schemas/user.schema';

const SALT_ROUNDS = 10;

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly rolesService: RolesService,
    private readonly permissionResolver: PermissionResolverService,
  ) {}

  async create(dto: CreateUserDto): Promise<UserDocument> {
    const existing = await this.userModel.findOne({ email: dto.email });
    if (existing) {
      throw new ConflictException('Email đã được sử dụng');
    }

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);
    const user = new this.userModel({
      email: dto.email,
      password: passwordHash,
      name: dto.name ?? '',
      roleIds: await this.getDefaultRoleIds(),
    });
    return user.save();
  }

  /** Admin tạo tài khoản trực tiếp (bỏ qua luồng đăng ký công khai), có thể gán role ngay. */
  async createByAdmin(dto: CreateUserByAdminDto): Promise<UserDocument> {
    const existing = await this.userModel.findOne({ email: dto.email });
    if (existing) {
      throw new ConflictException('Email đã được sử dụng');
    }

    const roleIds =
      dto.roleIds && dto.roleIds.length > 0
        ? await this.resolveRoleIds(dto.roleIds)
        : await this.getDefaultRoleIds();

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);
    const user = new this.userModel({
      email: dto.email,
      password: passwordHash,
      name: dto.name ?? '',
      roleIds,
    });
    const saved = await user.save();

    // `select: false` trên field password chỉ có tác dụng với query (find/findById...), không
    // áp dụng cho document vừa tạo bằng `new Model()` — refetch qua findById để Mongoose tự loại
    // các field nhạy cảm (password) khỏi kết quả trả về, thay vì tự xoá field thủ công.
    return (await this.userModel.findById(saved._id).exec())!;
  }

  async findAll(query: QueryUserDto): Promise<PaginatedResponseDto<UserDocument>> {
    const filter: FilterQuery<UserDocument> = {};

    if (query.search) {
      const search = new RegExp(escapeRegExp(query.search), 'i');
      filter.$or = [{ name: search }, { email: search }];
    }
    if (query.role) {
      filter.role = query.role;
    }
    if (query.isActive !== undefined) {
      filter.isActive = query.isActive;
    }

    const sortField = query.sortBy ?? 'createdAt';
    const sortOrder = query.sortOrder === 'asc' ? 1 : -1;

    const [items, totalItems] = await Promise.all([
      this.userModel
        .find(filter)
        .sort({ [sortField]: sortOrder })
        .skip(query.skip)
        .limit(query.limit)
        .exec(),
      this.userModel.countDocuments(filter).exec(),
    ]);

    return new PaginatedResponseDto(items, totalItems, query.page, query.limit);
  }

  findById(id: string) {
    return this.userModel.findById(id).exec();
  }

  async findOneOrThrow(id: string): Promise<UserDocument> {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }
    return user;
  }

  findByIdWithRefreshToken(id: string) {
    return this.userModel.findById(id).select('+refreshTokenHash').exec();
  }

  async updateProfile(id: string, dto: UpdateProfileDto): Promise<UserDocument> {
    const user = await this.userModel.findByIdAndUpdate(id, dto, { new: true }).exec();
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }
    return user;
  }

  async updatePassword(id: string, dto: UpdatePasswordDto): Promise<void> {
    const user = await this.userModel.findById(id).select('+password').exec();
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    const isMatch = await bcrypt.compare(dto.currentPassword, user.password);
    if (!isMatch) {
      throw new ConflictException('Mật khẩu hiện tại không đúng');
    }

    user.password = await bcrypt.hash(dto.newPassword, SALT_ROUNDS);
    await user.save();
  }

  async updateRole(
    actingUserId: string,
    targetId: string,
    dto: UpdateUserRoleDto,
  ): Promise<UserDocument> {
    this.ensureNotSelf(actingUserId, targetId, 'thay đổi role');

    const user = await this.userModel
      .findByIdAndUpdate(targetId, { role: dto.role }, { new: true })
      .exec();
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }
    return user;
  }

  async updateStatus(
    actingUserId: string,
    targetId: string,
    dto: UpdateUserStatusDto,
  ): Promise<UserDocument> {
    this.ensureNotSelf(actingUserId, targetId, 'thay đổi trạng thái');

    const user = await this.userModel
      .findByIdAndUpdate(targetId, { isActive: dto.isActive }, { new: true })
      .exec();
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }
    return user;
  }

  async remove(actingUserId: string, targetId: string): Promise<void> {
    this.ensureNotSelf(actingUserId, targetId, 'xoá');

    const user = await this.userModel.findByIdAndDelete(targetId).exec();
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }
    this.permissionResolver.invalidate(targetId);
  }

  async findRoles(id: string): Promise<RoleDocument[]> {
    const user = await this.userModel.findById(id).populate<{ roleIds: RoleDocument[] }>('roleIds').exec();
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }
    return user.roleIds;
  }

  async setRoles(
    actingUserId: string,
    targetId: string,
    dto: SetUserRolesDto,
  ): Promise<RoleDocument[]> {
    this.ensureNotSelf(actingUserId, targetId, 'gán role');

    const user = await this.userModel.findById(targetId).exec();
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    const roles = await this.resolveRoles(dto.roleIds);
    user.roleIds = roles.map((role) => role._id as Types.ObjectId);
    await user.save();
    this.permissionResolver.invalidate(targetId);

    return roles;
  }

  async removeRole(actingUserId: string, targetId: string, roleId: string): Promise<RoleDocument[]> {
    this.ensureNotSelf(actingUserId, targetId, 'gỡ role');

    const user = await this.userModel.findById(targetId).exec();
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    const hasRole = user.roleIds.some((id) => id.toString() === roleId);
    if (!hasRole) {
      throw new NotFoundException('Role không thuộc về người dùng này');
    }
    if (user.roleIds.length === 1) {
      throw new ConflictException('Không thể gỡ — đây là role cuối cùng của người dùng');
    }

    user.roleIds = user.roleIds.filter((id) => id.toString() !== roleId);
    await user.save();
    this.permissionResolver.invalidate(targetId);

    return this.findRoles(targetId);
  }

  async setRefreshTokenHash(id: string, refreshTokenHash: string | null): Promise<void> {
    await this.userModel.findByIdAndUpdate(id, { refreshTokenHash }).exec();
  }

  async setResetPasswordToken(
    id: string,
    token: string | null,
    expires: Date | null,
  ): Promise<void> {
    await this.userModel
      .findByIdAndUpdate(id, { resetPasswordToken: token, resetPasswordExpires: expires })
      .exec();
  }

  findByResetToken(token: string) {
    return this.userModel
      .findOne({ resetPasswordToken: token, resetPasswordExpires: { $gt: new Date() } })
      .select('+resetPasswordToken +resetPasswordExpires')
      .exec();
  }

  async resetPassword(id: string, newPassword: string): Promise<void> {
    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await this.userModel
      .findByIdAndUpdate(id, {
        password: passwordHash,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      })
      .exec();
  }

  findByEmailWithPassword(email: string) {
    return this.userModel.findOne({ email }).select('+password').exec();
  }

  private async getDefaultRoleIds(): Promise<Types.ObjectId[]> {
    const defaultRole = await this.rolesService.findByName(USER_ROLE_NAME);
    return defaultRole ? [defaultRole._id as Types.ObjectId] : [];
  }

  private async resolveRoleIds(roleIds: string[]): Promise<Types.ObjectId[]> {
    const roles = await this.resolveRoles(roleIds);
    return roles.map((role) => role._id as Types.ObjectId);
  }

  private async resolveRoles(roleIds: string[]): Promise<RoleDocument[]> {
    const roles = await this.rolesService.findManyByIds(roleIds);
    if (roles.length !== roleIds.length) {
      throw new NotFoundException('Một hoặc nhiều role không tồn tại');
    }
    return roles;
  }

  private ensureNotSelf(actingUserId: string, targetId: string, action: string): void {
    if (actingUserId === targetId) {
      throw new ConflictException(`Không thể tự ${action} tài khoản admin của chính mình qua endpoint này`);
    }
  }
}
