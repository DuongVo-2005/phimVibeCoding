import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RolePermissionsService } from '../role-permissions/role-permissions.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { Permission, PermissionDocument } from './schemas/permission.schema';

@Injectable()
export class PermissionsService {
  constructor(
    @InjectModel(Permission.name) private readonly permissionModel: Model<PermissionDocument>,
    private readonly rolePermissionsService: RolePermissionsService,
  ) {}

  async create(dto: CreatePermissionDto): Promise<PermissionDocument> {
    const existing = await this.permissionModel.findOne({ key: dto.key }).exec();
    if (existing) {
      throw new ConflictException('Permission đã tồn tại');
    }

    const [resource, action] = dto.key.split(':');
    return this.permissionModel.create({
      key: dto.key,
      resource,
      action,
      description: dto.description ?? '',
    });
  }

  findAll(): Promise<PermissionDocument[]> {
    return this.permissionModel.find().sort({ resource: 1, action: 1 }).exec();
  }

  async findOne(id: string): Promise<PermissionDocument> {
    const permission = await this.permissionModel.findById(id).exec();
    if (!permission) {
      throw new NotFoundException('Không tìm thấy permission');
    }
    return permission;
  }

  async update(id: string, dto: UpdatePermissionDto): Promise<PermissionDocument> {
    const permission = await this.permissionModel
      .findByIdAndUpdate(id, { description: dto.description }, { new: true })
      .exec();
    if (!permission) {
      throw new NotFoundException('Không tìm thấy permission');
    }
    return permission;
  }

  async remove(id: string): Promise<void> {
    const permission = await this.permissionModel.findByIdAndDelete(id).exec();
    if (!permission) {
      throw new NotFoundException('Không tìm thấy permission');
    }
    await this.rolePermissionsService.removeAllForPermission(id);
  }
}
