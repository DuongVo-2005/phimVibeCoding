import { getModelToken } from '@nestjs/mongoose';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DirectorsService } from './directors.service';
import { Director } from './schemas/director.schema';

const execResolves = (value: unknown) => ({ exec: jest.fn().mockResolvedValue(value) });

describe('DirectorsService', () => {
  let service: DirectorsService;
  let directorModel: {
    find: jest.Mock;
    findOne: jest.Mock;
    countDocuments: jest.Mock;
    findByIdAndUpdate: jest.Mock;
    findByIdAndDelete: jest.Mock;
    create: jest.Mock;
  };

  beforeEach(async () => {
    directorModel = {
      find: jest.fn(),
      findOne: jest.fn(),
      countDocuments: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      findByIdAndDelete: jest.fn(),
      create: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DirectorsService,
        { provide: getModelToken(Director.name), useValue: directorModel },
      ],
    }).compile();

    service = module.get(DirectorsService);
  });

  describe('create', () => {
    it('ném ConflictException khi đạo diễn đã tồn tại', async () => {
      directorModel.findOne.mockReturnValue(execResolves({ slug: 'vuong-gia-ve' }));

      await expect(service.create({ name: 'Vương Gia Vệ' })).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('tìm theo $text khi có query.search', async () => {
      const sort = jest.fn().mockReturnValue({
        skip: jest.fn().mockReturnValue({ limit: jest.fn().mockReturnValue(execResolves([])) }),
      });
      directorModel.find.mockReturnValue({ sort });
      directorModel.countDocuments.mockReturnValue(execResolves(0));

      await service.findAll({ page: 1, limit: 20, sortOrder: 'desc', search: 'Vuong', skip: 0 } as any);

      expect(directorModel.find).toHaveBeenCalledWith({ $text: { $search: 'Vuong' } });
    });
  });

  describe('remove', () => {
    it('ném NotFoundException khi không tìm thấy đạo diễn', async () => {
      directorModel.findByIdAndDelete.mockReturnValue(execResolves(null));

      await expect(service.remove('missing')).rejects.toThrow(NotFoundException);
    });
  });
});
