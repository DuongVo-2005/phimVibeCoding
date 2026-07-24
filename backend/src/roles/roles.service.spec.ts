import { getModelToken } from '@nestjs/mongoose';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Permission } from '../permissions/schemas/permission.schema';
import { RolePermissionsService } from '../role-permissions/role-permissions.service';
import { User } from '../users/schemas/user.schema';
import { ADMIN_ROLE_NAME, RolesService } from './roles.service';
import { Role } from './schemas/role.schema';

const execResolves = (value: unknown) => ({ exec: jest.fn().mockResolvedValue(value) });

describe('RolesService', () => {
  let service: RolesService;
  let roleModel: {
    findOne: jest.Mock;
    findById: jest.Mock;
    findByIdAndDelete: jest.Mock;
    create: jest.Mock;
    find: jest.Mock;
  };
  let userModel: { countDocuments: jest.Mock };
  let permissionModel: { countDocuments: jest.Mock };
  let rolePermissionsService: {
    setForRole: jest.Mock;
    findPermissionsForRole: jest.Mock;
    findPermissionKeysForRoles: jest.Mock;
    removeAllForRole: jest.Mock;
  };

  const buildRoleDoc = (overrides: Record<string, unknown> = {}) => ({
    _id: 'role-1',
    id: 'role-1',
    name: 'editor',
    description: '',
    isSystem: false,
    save: jest.fn().mockResolvedValue(undefined),
    toObject: jest.fn().mockReturnValue({ id: 'role-1', name: 'editor' }),
    ...overrides,
  });

  beforeEach(async () => {
    roleModel = {
      findOne: jest.fn(),
      findById: jest.fn(),
      findByIdAndDelete: jest.fn(),
      create: jest.fn(),
      find: jest.fn(),
    };
    userModel = { countDocuments: jest.fn() };
    permissionModel = { countDocuments: jest.fn() };
    rolePermissionsService = {
      setForRole: jest.fn(),
      findPermissionsForRole: jest.fn(),
      findPermissionKeysForRoles: jest.fn().mockResolvedValue([]),
      removeAllForRole: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesService,
        { provide: getModelToken(Role.name), useValue: roleModel },
        { provide: getModelToken(User.name), useValue: userModel },
        { provide: getModelToken(Permission.name), useValue: permissionModel },
        { provide: RolePermissionsService, useValue: rolePermissionsService },
      ],
    }).compile();

    service = module.get(RolesService);
  });

  describe('create', () => {
    it('ném ConflictException khi tên role đã tồn tại', async () => {
      roleModel.findOne.mockReturnValue(execResolves(buildRoleDoc()));

      await expect(service.create({ name: 'editor' })).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('ném ConflictException khi xoá role hệ thống (isSystem=true)', async () => {
      roleModel.findById.mockReturnValue(execResolves(buildRoleDoc({ isSystem: true })));

      await expect(service.remove('role-1')).rejects.toThrow(ConflictException);
    });

    it('ném ConflictException khi role đang được N user sử dụng', async () => {
      roleModel.findById.mockReturnValue(execResolves(buildRoleDoc()));
      userModel.countDocuments.mockReturnValue(execResolves(3));

      await expect(service.remove('role-1')).rejects.toThrow(ConflictException);
    });

    it('xoá thành công và cascade xoá role_permissions khi hợp lệ', async () => {
      roleModel.findById.mockReturnValue(execResolves(buildRoleDoc()));
      userModel.countDocuments.mockReturnValue(execResolves(0));
      roleModel.findByIdAndDelete.mockReturnValue(execResolves(buildRoleDoc()));

      await service.remove('role-1');

      expect(rolePermissionsService.removeAllForRole).toHaveBeenCalledWith('role-1');
    });
  });

  describe('update', () => {
    it('ném ConflictException khi cố đổi tên role hệ thống', async () => {
      roleModel.findById.mockReturnValue(
        execResolves(buildRoleDoc({ isSystem: true, name: 'admin' })),
      );

      await expect(service.update('role-1', { name: 'super-admin' })).rejects.toThrow(
        ConflictException,
      );
    });

    it('cho phép sửa description của role hệ thống', async () => {
      const role = buildRoleDoc({ isSystem: true, name: 'admin' });
      roleModel.findById.mockReturnValue(execResolves(role));

      await service.update('role-1', { description: 'Mô tả mới' });

      expect(role.save).toHaveBeenCalled();
    });
  });

  describe('setPermissions', () => {
    it('ném ConflictException khi set 0 permission cho role "admin"', async () => {
      roleModel.findById.mockReturnValue(execResolves(buildRoleDoc({ name: ADMIN_ROLE_NAME })));

      await expect(service.setPermissions('role-1', [])).rejects.toThrow(ConflictException);
    });

    it('ném NotFoundException khi có permissionId không tồn tại', async () => {
      roleModel.findById.mockReturnValue(execResolves(buildRoleDoc({ name: 'editor' })));
      permissionModel.countDocuments.mockReturnValue(execResolves(1));

      await expect(service.setPermissions('role-1', ['p1', 'p2'])).rejects.toThrow(
        NotFoundException,
      );
    });

    it('thay thế (không cộng dồn) tập permission khi tất cả permissionId hợp lệ', async () => {
      roleModel.findById.mockReturnValue(execResolves(buildRoleDoc({ name: 'editor' })));
      permissionModel.countDocuments.mockReturnValue(execResolves(2));
      rolePermissionsService.findPermissionsForRole.mockResolvedValue([{ key: 'films:read' }]);

      const result = await service.setPermissions('role-1', ['p1', 'p2']);

      expect(rolePermissionsService.setForRole).toHaveBeenCalledWith('role-1', ['p1', 'p2']);
      expect(result).toEqual([{ key: 'films:read' }]);
    });
  });
});
