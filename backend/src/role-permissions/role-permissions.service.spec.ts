import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { RolePermission } from './schemas/role-permission.schema';
import { RolePermissionsService } from './role-permissions.service';

const execResolves = (value: unknown) => ({ exec: jest.fn().mockResolvedValue(value) });

const ROLE_ID = '65f1a2b3c4d5e6f7a8b9c0d1';
const PERMISSION_ID_1 = '65f1a2b3c4d5e6f7a8b9c0d2';
const PERMISSION_ID_2 = '65f1a2b3c4d5e6f7a8b9c0d3';

describe('RolePermissionsService', () => {
  let service: RolePermissionsService;
  let rolePermissionModel: {
    deleteMany: jest.Mock;
    insertMany: jest.Mock;
    find: jest.Mock;
  };

  beforeEach(async () => {
    rolePermissionModel = {
      deleteMany: jest.fn(),
      insertMany: jest.fn(),
      find: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolePermissionsService,
        { provide: getModelToken(RolePermission.name), useValue: rolePermissionModel },
      ],
    }).compile();

    service = module.get(RolePermissionsService);
  });

  describe('setForRole — thay thế toàn bộ permission của role (không cộng dồn)', () => {
    it('xoá toàn bộ permission cũ theo role, rồi insertMany permission mới với đúng ObjectId', async () => {
      rolePermissionModel.deleteMany.mockReturnValue(execResolves(undefined));
      rolePermissionModel.insertMany.mockResolvedValue([]);

      await service.setForRole(ROLE_ID, [PERMISSION_ID_1, PERMISSION_ID_2]);

      expect(rolePermissionModel.deleteMany).toHaveBeenCalledWith({
        role: expect.any(Types.ObjectId),
      });
      const deleteFilter = rolePermissionModel.deleteMany.mock.calls[0][0];
      expect(deleteFilter.role.toString()).toBe(ROLE_ID);

      expect(rolePermissionModel.insertMany).toHaveBeenCalledWith([
        { role: expect.any(Types.ObjectId), permission: expect.any(Types.ObjectId) },
        { role: expect.any(Types.ObjectId), permission: expect.any(Types.ObjectId) },
      ]);
      const insertedArg = rolePermissionModel.insertMany.mock.calls[0][0];
      expect(insertedArg[0].role.toString()).toBe(ROLE_ID);
      expect(insertedArg[0].permission.toString()).toBe(PERMISSION_ID_1);
      expect(insertedArg[1].permission.toString()).toBe(PERMISSION_ID_2);
    });

    it('permissionIds rỗng -> chỉ xoá, KHÔNG gọi insertMany (tránh insertMany([]) không cần thiết)', async () => {
      rolePermissionModel.deleteMany.mockReturnValue(execResolves(undefined));

      await service.setForRole(ROLE_ID, []);

      expect(rolePermissionModel.deleteMany).toHaveBeenCalled();
      expect(rolePermissionModel.insertMany).not.toHaveBeenCalled();
    });

    it('luôn xoá trước khi insert (thứ tự gọi đúng), đảm bảo thay thế toàn bộ chứ không cộng dồn', async () => {
      const callOrder: string[] = [];
      rolePermissionModel.deleteMany.mockImplementation(() => {
        callOrder.push('deleteMany');
        return execResolves(undefined);
      });
      rolePermissionModel.insertMany.mockImplementation(() => {
        callOrder.push('insertMany');
        return Promise.resolve([]);
      });

      await service.setForRole(ROLE_ID, [PERMISSION_ID_1]);

      expect(callOrder).toEqual(['deleteMany', 'insertMany']);
    });
  });

  describe('removeAllForRole', () => {
    it('xoá toàn bộ role-permission theo đúng roleId (ép kiểu ObjectId)', async () => {
      rolePermissionModel.deleteMany.mockReturnValue(execResolves(undefined));

      await service.removeAllForRole(ROLE_ID);

      expect(rolePermissionModel.deleteMany).toHaveBeenCalledWith({
        role: expect.any(Types.ObjectId),
      });
      const filter = rolePermissionModel.deleteMany.mock.calls[0][0];
      expect(filter.role.toString()).toBe(ROLE_ID);
    });
  });

  describe('removeAllForPermission', () => {
    it('xoá toàn bộ role-permission theo đúng permissionId (ép kiểu ObjectId)', async () => {
      rolePermissionModel.deleteMany.mockReturnValue(execResolves(undefined));

      await service.removeAllForPermission(PERMISSION_ID_1);

      expect(rolePermissionModel.deleteMany).toHaveBeenCalledWith({
        permission: expect.any(Types.ObjectId),
      });
      const filter = rolePermissionModel.deleteMany.mock.calls[0][0];
      expect(filter.permission.toString()).toBe(PERMISSION_ID_1);
    });
  });

  describe('findPermissionKeysForRoles — ObjectId cast cho $in', () => {
    it('ép kiểu toàn bộ roleIds (kể cả khi truyền vào là string) sang ObjectId trước khi query $in', async () => {
      const chain: any = { populate: jest.fn() };
      chain.populate.mockReturnValue(execResolves([]));
      rolePermissionModel.find.mockReturnValue(chain);

      await service.findPermissionKeysForRoles([ROLE_ID]);

      const filter = rolePermissionModel.find.mock.calls[0][0];
      expect(filter.role.$in[0]).toBeInstanceOf(Types.ObjectId);
      expect(filter.role.$in[0].toString()).toBe(ROLE_ID);
    });

    it('roleIds rỗng -> trả về [] ngay, không query DB', async () => {
      const result = await service.findPermissionKeysForRoles([]);

      expect(result).toEqual([]);
      expect(rolePermissionModel.find).not.toHaveBeenCalled();
    });
  });
});
