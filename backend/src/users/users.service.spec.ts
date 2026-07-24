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

type UserModelMock = jest.Mock & {
  findById: jest.Mock;
  findByIdAndUpdate: jest.Mock;
  findByIdAndDelete: jest.Mock;
  findOne: jest.Mock;
  countDocuments: jest.Mock;
  find: jest.Mock;
};

describe('UsersService', () => {
  let service: UsersService;
  let userModel: UserModelMock;
  let rolesService: { findManyByIds: jest.Mock; findByName: jest.Mock };
  let permissionResolver: { invalidate: jest.Mock };

  beforeEach(async () => {
    // create()/createByAdmin() dùng `new this.userModel(doc)` rồi `.save()` — mock model phải vừa
    // gọi được như constructor vừa mang các static method (findById, findOne, ...).
    const ctor = jest.fn().mockImplementation((doc: Record<string, unknown>) => ({
      ...doc,
      _id: 'new-user-id',
      save: jest.fn().mockResolvedValue({ ...doc, _id: 'new-user-id' }),
    }));
    userModel = Object.assign(ctor, {
      findById: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      findByIdAndDelete: jest.fn(),
      findOne: jest.fn(),
      countDocuments: jest.fn(),
      find: jest.fn(),
    });
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

  describe('createByAdmin', () => {
    const dto = { email: 'new-user@example.com', password: 'Password123', name: 'New User' };

    it('ném ConflictException khi email đã tồn tại', async () => {
      userModel.findOne.mockResolvedValue({ _id: 'existing-user' });

      await expect(service.createByAdmin(dto)).rejects.toThrow(ConflictException);
      expect(userModel).not.toHaveBeenCalled();
    });

    it('không truyền roleIds -> dùng role mặc định (user)', async () => {
      userModel.findOne.mockResolvedValue(null);
      const defaultRoleId = new Types.ObjectId();
      rolesService.findByName.mockResolvedValue({ _id: defaultRoleId });
      // Refetch qua findById sau save() — mô phỏng Mongoose tự loại password (select:false).
      userModel.findById.mockReturnValue(
        execResolves({ _id: 'new-user-id', email: dto.email, name: dto.name, roleIds: [defaultRoleId] }),
      );

      const result = await service.createByAdmin(dto);

      expect(rolesService.findByName).toHaveBeenCalledWith('user');
      expect(rolesService.findManyByIds).not.toHaveBeenCalled();
      expect(userModel).toHaveBeenCalledWith(
        expect.objectContaining({
          email: dto.email,
          name: dto.name,
          roleIds: [defaultRoleId],
        }),
      );
      expect(userModel.findById).toHaveBeenCalledWith('new-user-id');
      expect(result).toEqual(expect.objectContaining({ email: dto.email }));
      expect(result).not.toHaveProperty('password');
      // password vẫn phải được hash trước khi save, không lưu plaintext
      const createdArg = userModel.mock.calls[0][0];
      expect(createdArg.password).not.toBe(dto.password);
    });

    it('có truyền roleIds -> dùng đúng roleIds được resolve, không dùng role mặc định', async () => {
      userModel.findOne.mockResolvedValue(null);
      const roleId = new Types.ObjectId();
      rolesService.findManyByIds.mockResolvedValue([{ _id: roleId }]);
      userModel.findById.mockReturnValue(
        execResolves({ _id: 'new-user-id', email: dto.email, roleIds: [roleId] }),
      );

      await service.createByAdmin({ ...dto, roleIds: [roleId.toString()] });

      expect(rolesService.findByName).not.toHaveBeenCalled();
      expect(userModel).toHaveBeenCalledWith(
        expect.objectContaining({ roleIds: [roleId] }),
      );
    });

    it('ném NotFoundException khi có roleId trong dto không tồn tại', async () => {
      userModel.findOne.mockResolvedValue(null);
      rolesService.findManyByIds.mockResolvedValue([]); // resolve được ít hơn số roleId truyền vào

      await expect(
        service.createByAdmin({ ...dto, roleIds: [new Types.ObjectId().toString()] }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    const buildQuery = (overrides: Record<string, unknown> = {}) => ({
      page: 1,
      limit: 10,
      skip: 0,
      ...overrides,
    });

    const mockFind = (items: unknown[], totalItems: number) => {
      const chain = { sort: jest.fn(), skip: jest.fn(), limit: jest.fn(), exec: jest.fn() };
      chain.sort.mockReturnValue(chain);
      chain.skip.mockReturnValue(chain);
      chain.limit.mockReturnValue(chain);
      chain.exec.mockResolvedValue(items);
      userModel.find.mockReturnValue(chain);
      userModel.countDocuments.mockReturnValue(execResolves(totalItems));
      return chain;
    };

    it('không filter gì -> trả về PaginatedResponseDto với meta đúng', async () => {
      mockFind([{ _id: 'u1' }, { _id: 'u2' }], 2);

      const result = await service.findAll(buildQuery() as any);

      expect(userModel.find).toHaveBeenCalledWith({});
      expect(result.items).toHaveLength(2);
      expect(result.meta).toEqual({ page: 1, limit: 10, totalItems: 2, totalPages: 1 });
    });

    it('có search -> filter $or theo regex trên name/email', async () => {
      mockFind([], 0);

      await service.findAll(buildQuery({ search: 'nguyen' }) as any);

      const filterArg = userModel.find.mock.calls[0][0];
      expect(filterArg.$or).toEqual([
        { name: expect.any(RegExp) },
        { email: expect.any(RegExp) },
      ]);
      expect(filterArg.$or[0].name.test('Nguyen Van A')).toBe(true);
    });

    it('có role -> filter theo role', async () => {
      mockFind([], 0);

      await service.findAll(buildQuery({ role: UserRole.ADMIN }) as any);

      expect(userModel.find).toHaveBeenCalledWith({ role: UserRole.ADMIN });
    });

    it('isActive=false (đã qua transform ở tầng DTO) -> filter isActive=false, KHÔNG bị bỏ qua', async () => {
      // Lưu ý: rủi ro "Boolean('false') === true" nằm ở tầng class-transformer của QueryUserDto,
      // không nằm trong service này — service chỉ kiểm tra `!== undefined` nên khi nhận đúng
      // primitive boolean `false` thì luôn xử lý đúng. Rủi ro thật được test riêng ở e2e (query
      // string thực tế qua HTTP, đi qua toàn bộ pipeline transform).
      mockFind([], 0);

      await service.findAll(buildQuery({ isActive: false }) as any);

      expect(userModel.find).toHaveBeenCalledWith({ isActive: false });
    });

    it('phân trang -> gọi đúng skip/limit theo query', async () => {
      const chain = mockFind([], 0);

      await service.findAll(buildQuery({ page: 3, limit: 5, skip: 10 }) as any);

      expect(chain.skip).toHaveBeenCalledWith(10);
      expect(chain.limit).toHaveBeenCalledWith(5);
    });
  });

  describe('findOneOrThrow', () => {
    it('trả về user khi tồn tại', async () => {
      const user = { _id: 'user-1', email: 'user@example.com' };
      userModel.findById.mockReturnValue(execResolves(user));

      const result = await service.findOneOrThrow('user-1');
      expect(result).toBe(user);
    });

    it('ném NotFoundException khi không tồn tại', async () => {
      userModel.findById.mockReturnValue(execResolves(null));

      await expect(service.findOneOrThrow('khong-ton-tai')).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('xoá thành công -> gọi permissionResolver.invalidate với đúng targetId', async () => {
      userModel.findByIdAndDelete.mockReturnValue(execResolves({ _id: 'user-2' }));

      await service.remove('admin-1', 'user-2');

      expect(userModel.findByIdAndDelete).toHaveBeenCalledWith('user-2');
      expect(permissionResolver.invalidate).toHaveBeenCalledWith('user-2');
    });

    it('ném NotFoundException khi user không tồn tại, KHÔNG gọi invalidate', async () => {
      userModel.findByIdAndDelete.mockReturnValue(execResolves(null));

      await expect(service.remove('admin-1', 'khong-ton-tai')).rejects.toThrow(NotFoundException);
      expect(permissionResolver.invalidate).not.toHaveBeenCalled();
    });
  });

  describe('findRoles', () => {
    it('trả về roleIds đã populate', async () => {
      const roles = [{ _id: 'role-1', name: 'admin' }];
      const chain = { populate: jest.fn() };
      chain.populate.mockReturnValue(execResolves({ _id: 'user-1', roleIds: roles }));
      userModel.findById.mockReturnValue(chain);

      const result = await service.findRoles('user-1');

      expect(chain.populate).toHaveBeenCalledWith('roleIds');
      expect(result).toBe(roles);
    });

    it('ném NotFoundException khi user không tồn tại', async () => {
      const chain = { populate: jest.fn() };
      chain.populate.mockReturnValue(execResolves(null));
      userModel.findById.mockReturnValue(chain);

      await expect(service.findRoles('khong-ton-tai')).rejects.toThrow(NotFoundException);
    });
  });
});
