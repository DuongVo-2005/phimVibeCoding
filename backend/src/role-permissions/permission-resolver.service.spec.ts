import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { User } from '../users/schemas/user.schema';
import { PermissionResolverService } from './permission-resolver.service';
import { RolePermissionsService } from './role-permissions.service';

describe('PermissionResolverService', () => {
  let service: PermissionResolverService;
  let userModel: { findById: jest.Mock };
  let rolePermissionsService: { findPermissionKeysForRoles: jest.Mock };

  beforeEach(async () => {
    userModel = { findById: jest.fn() };
    rolePermissionsService = { findPermissionKeysForRoles: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionResolverService,
        { provide: getModelToken(User.name), useValue: userModel },
        { provide: RolePermissionsService, useValue: rolePermissionsService },
      ],
    }).compile();

    service = module.get(PermissionResolverService);
  });

  const mockUserWithRoles = (roleIds: string[]) => {
    userModel.findById.mockReturnValue({
      select: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue({ roleIds }) }),
    });
  };

  it('resolve permission keys từ roleIds của user', async () => {
    mockUserWithRoles(['role-1']);
    rolePermissionsService.findPermissionKeysForRoles.mockResolvedValue(['films:create']);

    const keys = await service.getPermissionKeysForUser('user-1');

    expect(keys.has('films:create')).toBe(true);
  });

  it('trả về tập rỗng khi user không có roleIds', async () => {
    mockUserWithRoles([]);

    const keys = await service.getPermissionKeysForUser('user-1');

    expect(keys.size).toBe(0);
    expect(rolePermissionsService.findPermissionKeysForRoles).not.toHaveBeenCalled();
  });

  it('cache kết quả theo user — gọi lần 2 không truy vấn DB lại', async () => {
    mockUserWithRoles(['role-1']);
    rolePermissionsService.findPermissionKeysForRoles.mockResolvedValue(['films:create']);

    await service.getPermissionKeysForUser('user-1');
    await service.getPermissionKeysForUser('user-1');

    expect(userModel.findById).toHaveBeenCalledTimes(1);
  });

  it('invalidate() xoá cache — lần gọi tiếp theo truy vấn DB lại', async () => {
    mockUserWithRoles(['role-1']);
    rolePermissionsService.findPermissionKeysForRoles.mockResolvedValue(['films:create']);

    await service.getPermissionKeysForUser('user-1');
    service.invalidate('user-1');
    await service.getPermissionKeysForUser('user-1');

    expect(userModel.findById).toHaveBeenCalledTimes(2);
  });
});
