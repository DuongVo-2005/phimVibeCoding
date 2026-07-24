import { getModelToken } from '@nestjs/mongoose';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesService } from './categories.service';
import { Category } from './schemas/category.schema';
import { Film } from '../films/schemas/film.schema';

const execResolves = (value: unknown) => ({ exec: jest.fn().mockResolvedValue(value) });

describe('CategoriesService', () => {
  let service: CategoriesService;
  let categoryModel: {
    find: jest.Mock;
    findOne: jest.Mock;
    findById: jest.Mock;
    findByIdAndUpdate: jest.Mock;
    findByIdAndDelete: jest.Mock;
    create: jest.Mock;
  };
  let filmModel: { countDocuments: jest.Mock };

  beforeEach(async () => {
    categoryModel = {
      find: jest.fn(),
      findOne: jest.fn(),
      findById: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      findByIdAndDelete: jest.fn(),
      create: jest.fn(),
    };
    filmModel = { countDocuments: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        { provide: getModelToken(Category.name), useValue: categoryModel },
        { provide: getModelToken(Film.name), useValue: filmModel },
      ],
    }).compile();

    service = module.get(CategoriesService);
  });

  describe('findAll', () => {
    it('mặc định chỉ lọc isActive=true khi không truyền query.isActive', async () => {
      const sort = jest.fn().mockReturnValue(execResolves([]));
      categoryModel.find.mockReturnValue({ sort });

      await service.findAll({});

      expect(categoryModel.find).toHaveBeenCalledWith({ isActive: true });
    });

    it('cho phép lọc isActive=false khi truyền tường minh', async () => {
      const sort = jest.fn().mockReturnValue(execResolves([]));
      categoryModel.find.mockReturnValue({ sort });

      await service.findAll({ isActive: false });

      expect(categoryModel.find).toHaveBeenCalledWith({ isActive: false });
    });
  });

  describe('create', () => {
    it('ném ConflictException khi tên danh mục đã tồn tại (trùng slug)', async () => {
      categoryModel.findOne.mockReturnValue(execResolves({ slug: 'hanh-dong' }));

      await expect(service.create({ name: 'Hành Động' })).rejects.toThrow(ConflictException);
    });
  });

  describe('update', () => {
    it('KHÔNG tự suy lại slug từ name (khác Actors/Directors/Countries) — slug là URL công khai, phải ổn định', async () => {
      categoryModel.findByIdAndUpdate.mockReturnValue(
        execResolves({ id: 'cat-1', name: 'Hài Hước Mới', slug: 'hanh-dong' }),
      );

      await service.update('cat-1', { name: 'Hài Hước Mới' });

      // Phải gọi update với đúng payload gốc (không có field `slug` được thêm vào).
      expect(categoryModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'cat-1',
        { name: 'Hài Hước Mới' },
        { new: true },
      );
    });

    it('ném NotFoundException khi không tìm thấy danh mục', async () => {
      categoryModel.findByIdAndUpdate.mockReturnValue(execResolves(null));

      await expect(service.update('missing', { name: 'X' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('ném ConflictException khi còn phim tham chiếu tới danh mục', async () => {
      categoryModel.findById.mockReturnValue(execResolves({ _id: 'cat-1' }));
      filmModel.countDocuments.mockReturnValue(execResolves(5));

      await expect(service.remove('cat-1')).rejects.toThrow(ConflictException);
      expect(categoryModel.findByIdAndDelete).not.toHaveBeenCalled();
    });

    it('xoá thành công khi không còn phim nào tham chiếu', async () => {
      categoryModel.findById.mockReturnValue(execResolves({ _id: 'cat-1' }));
      filmModel.countDocuments.mockReturnValue(execResolves(0));
      categoryModel.findByIdAndDelete.mockReturnValue(execResolves({ _id: 'cat-1' }));

      await service.remove('cat-1');

      expect(categoryModel.findByIdAndDelete).toHaveBeenCalledWith('cat-1');
    });

    it('ném NotFoundException khi không tìm thấy danh mục để xoá', async () => {
      categoryModel.findById.mockReturnValue(execResolves(null));

      await expect(service.remove('missing')).rejects.toThrow(NotFoundException);
    });
  });
});
