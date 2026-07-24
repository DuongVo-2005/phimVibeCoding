import { getModelToken } from '@nestjs/mongoose';
import { ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ActorsService } from './actors.service';
import { Actor } from './schemas/actor.schema';

const execResolves = (value: unknown) => ({ exec: jest.fn().mockResolvedValue(value) });

describe('ActorsService', () => {
  let service: ActorsService;
  let actorModel: {
    find: jest.Mock;
    findOne: jest.Mock;
    findById: jest.Mock;
    findByIdAndUpdate: jest.Mock;
    findByIdAndDelete: jest.Mock;
    countDocuments: jest.Mock;
    create: jest.Mock;
  };

  beforeEach(async () => {
    actorModel = {
      find: jest.fn(),
      findOne: jest.fn(),
      findById: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      findByIdAndDelete: jest.fn(),
      countDocuments: jest.fn(),
      create: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [ActorsService, { provide: getModelToken(Actor.name), useValue: actorModel }],
    }).compile();

    service = module.get(ActorsService);
  });

  describe('findOrCreateByName', () => {
    it('actor chưa tồn tại (theo slug) -> tạo mới với đúng slug', async () => {
      actorModel.findOne.mockReturnValue(execResolves(null));
      const created = { _id: 'actor-1', name: 'Tom Holland', slug: 'tom-holland' };
      actorModel.create.mockResolvedValue(created);

      const result = await service.findOrCreateByName('Tom Holland');

      expect(actorModel.findOne).toHaveBeenCalledWith({ slug: 'tom-holland' });
      expect(actorModel.create).toHaveBeenCalledWith({ name: 'Tom Holland', slug: 'tom-holland' });
      expect(result).toBe(created);
    });

    it('actor đã tồn tại (trùng slug) -> trả về actor có sẵn, KHÔNG tạo mới', async () => {
      const existing = { _id: 'actor-1', name: 'Tom Holland', slug: 'tom-holland' };
      actorModel.findOne.mockReturnValue(execResolves(existing));

      const result = await service.findOrCreateByName('Tom Holland');

      expect(result).toBe(existing);
      expect(actorModel.create).not.toHaveBeenCalled();
    });

    it('2 tên khác nhau nhưng cùng chuẩn hoá slug -> vẫn coi là trùng, không tạo mới', async () => {
      // toSlug thường lowercase + bỏ dấu — "Tom Holland" và "tom holland" phải ra cùng 1 slug.
      const existing = { _id: 'actor-1', name: 'Tom Holland', slug: 'tom-holland' };
      actorModel.findOne.mockReturnValue(execResolves(existing));

      const result = await service.findOrCreateByName('tom holland');

      expect(actorModel.findOne).toHaveBeenCalledWith({ slug: 'tom-holland' });
      expect(result).toBe(existing);
      expect(actorModel.create).not.toHaveBeenCalled();
    });
  });

  describe('create — duplicate actor', () => {
    it('tên trùng (trùng slug với actor có sẵn) -> ConflictException, không tạo mới', async () => {
      actorModel.findOne.mockReturnValue(execResolves({ _id: 'actor-1', slug: 'tom-holland' }));

      await expect(service.create({ name: 'Tom Holland' } as any)).rejects.toThrow(
        ConflictException,
      );
      expect(actorModel.create).not.toHaveBeenCalled();
    });

    it('tên chưa tồn tại -> tạo thành công với slug tính từ tên', async () => {
      actorModel.findOne.mockReturnValue(execResolves(null));
      actorModel.create.mockResolvedValue({ _id: 'actor-1', name: 'Zendaya', slug: 'zendaya' });

      const result = await service.create({ name: 'Zendaya' } as any);

      expect(actorModel.create).toHaveBeenCalledWith({ name: 'Zendaya', slug: 'zendaya' });
      expect(result).toEqual(expect.objectContaining({ slug: 'zendaya' }));
    });
  });

  describe('findAll — search ($text $search)', () => {
    const mockFind = (items: unknown[], totalItems: number) => {
      const chain = { sort: jest.fn(), skip: jest.fn(), limit: jest.fn(), exec: jest.fn() };
      chain.sort.mockReturnValue(chain);
      chain.skip.mockReturnValue(chain);
      chain.limit.mockReturnValue(chain);
      chain.exec.mockResolvedValue(items);
      actorModel.find.mockReturnValue(chain);
      actorModel.countDocuments.mockReturnValue(execResolves(totalItems));
      return chain;
    };

    it('có search -> filter dùng $text $search', async () => {
      mockFind([], 0);

      await service.findAll({ search: 'Tom', page: 1, limit: 10, skip: 0 } as any);

      expect(actorModel.find).toHaveBeenCalledWith({ $text: { $search: 'Tom' } });
    });

    it('không truyền gì -> filter rỗng', async () => {
      mockFind([], 0);

      await service.findAll({ page: 1, limit: 10, skip: 0 } as any);

      expect(actorModel.find).toHaveBeenCalledWith({});
    });
  });

  describe('findAll — letter filter', () => {
    const mockFind = (items: unknown[], totalItems: number) => {
      const chain = { sort: jest.fn(), skip: jest.fn(), limit: jest.fn(), exec: jest.fn() };
      chain.sort.mockReturnValue(chain);
      chain.skip.mockReturnValue(chain);
      chain.limit.mockReturnValue(chain);
      chain.exec.mockResolvedValue(items);
      actorModel.find.mockReturnValue(chain);
      actorModel.countDocuments.mockReturnValue(execResolves(totalItems));
      return chain;
    };

    it('letter=T -> filter name bằng regex ^T (không phân biệt hoa/thường)', async () => {
      mockFind([], 0);

      await service.findAll({ letter: 'T', page: 1, limit: 10, skip: 0 } as any);

      const filterArg = actorModel.find.mock.calls[0][0];
      expect(filterArg.name).toBeInstanceOf(RegExp);
      expect(filterArg.name.test('Tom Holland')).toBe(true);
      expect(filterArg.name.test('tom holland')).toBe(true);
      expect(filterArg.name.test('Zendaya')).toBe(false);
    });
  });
});
