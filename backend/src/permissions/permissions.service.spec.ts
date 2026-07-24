import { getModelToken } from '@nestjs/mongoose';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { RolePermissionsService } from '../role-permissions/role-permissions.service';
import { PermissionsService } from './permissions.service';
import { Permission } from './schemas/permission.schema';

const execResolves = (value: unknown) => ({ exec: jest.fn().mockResolvedValue(value) });

describe('PermissionsService', () => {
  let service: PermissionsService;
  let permissionModel: {
    findOne: jest.Mock;
    findById: jest.Mock;
    findByIdAndUpdate: jest.Mock;
    findByIdAndDelete: jest.Mock;
    create: jest.Mock;
    find: jest.Mock;
  };
  let rolePermissionsService: { removeAllForPermission: jest.Mock };

  beforeEach(async () => {
    permissionModel = {
      findOne: jest.fn(),
      findById: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      findByIdAndDelete: jest.fn(),
      create: jest.fn(),
      find: jest.fn(),
    };
    rolePermissionsService = { removeAllForPermission: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionsService,
        { provide: getModelToken(Permission.name), useValue: permissionModel },
        { provide: RolePermissionsService, useValue: rolePermissionsService },
      ],
    }).compile();

    service = module.get(PermissionsService);
  });

  describe('create', () => {
    it('ném ConflictException khi key đã tồn tại', async () => {
      permissionModel.findOne.mockReturnValue(execResolves({ key: 'films:create' }));

      await expect(service.create({ key: 'films:create' })).rejects.toThrow(ConflictException);
    });

    it('tách key thành resource/action khi tạo mới', async () => {
      permissionModel.findOne.mockReturnValue(execResolves(null));
      permissionModel.create.mockResolvedValue({
        key: 'films:create',
        resource: 'films',
        action: 'create',
      });

      await service.create({ key: 'films:create', description: 'Tạo phim' });

      expect(permissionModel.create).toHaveBeenCalledWith({
        key: 'films:create',
        resource: 'films',
        action: 'create',
        description: 'Tạo phim',
      });
    });
  });

  describe('update', () => {
    it('chỉ cập nhật description, không cho sửa key (key không có trong UpdatePermissionDto)', async () => {
      permissionModel.findByIdAndUpdate.mockReturnValue(
        execResolves({ key: 'films:create', description: 'Mô tả mới' }),
      );

      await service.update('perm-1', { description: 'Mô tả mới' });

      expect(permissionModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'perm-1',
        { description: 'Mô tả mới' },
        { new: true },
      );
    });
  });

  describe('remove', () => {
    it('ném NotFoundException khi không tìm thấy permission', async () => {
      permissionModel.findByIdAndDelete.mockReturnValue(execResolves(null));

      await expect(service.remove('missing-id')).rejects.toThrow(NotFoundException);
    });

    it('xoá thành công và cascade xoá role_permissions liên quan', async () => {
      permissionModel.findByIdAndDelete.mockReturnValue(execResolves({ key: 'films:create' }));

      await service.remove('perm-1');

      expect(rolePermissionsService.removeAllForPermission).toHaveBeenCalledWith('perm-1');
    });
  });
});
