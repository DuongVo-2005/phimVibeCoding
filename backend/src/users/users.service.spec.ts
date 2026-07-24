import { getModelToken } from '@nestjs/mongoose';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { UserRole } from '../common/constants';
import { PermissionResolverService } from '../role-permissions/permission-resolver.service';
import { RolesService } from '../roles/roles.service';
import { User } from './schemas/user.schema';
import { UsersService } from './users.service';

const execResolves = (value: unknown) => ({ exec: jest.fn().mockResolvedValue(value) });

describe('UsersService', () => {
  let service: UsersService;
  let userModel: {
    findById: jest.Mock;
    findByIdAndUpdate: jest.Mock;
    findByIdAndDelete: jest.Mock;
  };
  let rolesService: { findManyByIds: jest.Mock; findByName: jest.Mock };
  let permissionResolver: { invalidate: jest.Mock };

  beforeEach(async () => {
    userModel = {
      findById: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      findByIdAndDelete: jest.fn(),
    };
    rolesService = { findManyByIds: jest.fn(), findByName: jest.fn() };
    permissionResolver = { invalidate: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getModelToken(User.name), useValue: userModel },
        { provide: RolesService, useValue: rolesService },
        { provide: PermissionResolverService, useValue: permissionResolver },
      ],
    }).compile();

    service = module.get(UsersService);
  });

  describe('self-lockout — admin không thể tự thao tác lên chính tài khoản mình', () => {
    it('updateRole ném ConflictException khi actingUserId === targetId', async () => {
      await expect(
        service.updateRole('user-1', 'user-1', { role: UserRole.ADMIN }),
      ).rejects.toThrow(ConflictException);
    });

    it('updateStatus ném ConflictException khi actingUserId === targetId', async () => {
      await expect(service.updateStatus('user-1', 'user-1', { isActive: false })).rejects.toThrow(
        ConflictException,
      );
    });

    it('remove ném ConflictException khi actingUserId === targetId', async () => {
      await expect(service.remove('user-1', 'user-1')).rejects.toThrow(ConflictException);
    });

    it('setRoles ném ConflictException khi actingUserId === targetId', async () => {
      await expect(
        service.setRoles('user-1', 'user-1', { roleIds: ['role-1'] }),
      ).rejects.toThrow(ConflictException);
    });

    it('removeRole ném ConflictException khi actingUserId === targetId', async () => {
      await expect(service.removeRole('user-1', 'user-1', 'role-1')).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('setRoles (PUT — thay thế toàn bộ, không cộng dồn)', () => {
    it('ném NotFoundException khi có roleId không tồn tại', async () => {
      userModel.findById.mockReturnValue(execResolves({ _id: 'user-2', roleIds: [] }));
      rolesService.findManyByIds.mockResolvedValue([{ _id: 'role-1' }]);

      await expect(
        service.setRoles('admin-1', 'user-2', { roleIds: ['role-1', 'role-2'] }),
      ).rejects.toThrow(NotFoundException);
    });

    it('thay thế toàn bộ roleIds hiện có bằng tập mới, không cộng dồn', async () => {
      const targetUser = {
        _id: 'user-2',
        roleIds: [new Types.ObjectId()],
        save: jest.fn().mockResolvedValue(undefined),
      };
      userModel.findById.mockReturnValue(execResolves(targetUser));
      const newRoleId = new Types.ObjectId();
      rolesService.findManyByIds.mockResolvedValue([{ _id: newRoleId }]);

      const result = await service.setRoles('admin-1', 'user-2', {
        roleIds: [newRoleId.toString()],
      });

      expect(targetUser.roleIds).toEqual([newRoleId]);
      expect(targetUser.save).toHaveBeenCalled();
      expect(permissionResolver.invalidate).toHaveBeenCalledWith('user-2');
      expect(result).toEqual([{ _id: newRoleId }]);
    });
  });

  describe('removeRole', () => {
    it('ném ConflictException khi đây là role cuối cùng của user', async () => {
      const roleId = new Types.ObjectId();
      userModel.findById.mockReturnValue(execResolves({ _id: 'user-2', roleIds: [roleId] }));

      await expect(service.removeRole('admin-1', 'user-2', roleId.toString())).rejects.toThrow(
        ConflictException,
      );
    });

    it('ném NotFoundException khi roleId không thuộc về user', async () => {
      userModel.findById.mockReturnValue(
        execResolves({ _id: 'user-2', roleIds: [new Types.ObjectId(), new Types.ObjectId()] }),
      );

      await expect(
        service.removeRole('admin-1', 'user-2', new Types.ObjectId().toString()),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
