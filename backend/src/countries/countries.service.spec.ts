import { getModelToken } from '@nestjs/mongoose';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CountriesService } from './countries.service';
import { Country } from './schemas/country.schema';

const execResolves = (value: unknown) => ({ exec: jest.fn().mockResolvedValue(value) });

describe('CountriesService', () => {
  let service: CountriesService;
  let countryModel: {
    findOne: jest.Mock;
    findByIdAndUpdate: jest.Mock;
    findByIdAndDelete: jest.Mock;
    create: jest.Mock;
  };

  beforeEach(async () => {
    countryModel = {
      findOne: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      findByIdAndDelete: jest.fn(),
      create: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CountriesService,
        { provide: getModelToken(Country.name), useValue: countryModel },
      ],
    }).compile();

    service = module.get(CountriesService);
  });

  describe('create', () => {
    it('ném ConflictException khi quốc gia đã tồn tại', async () => {
      countryModel.findOne.mockReturnValue(execResolves({ slug: 'han-quoc' }));

      await expect(service.create({ name: 'Hàn Quốc' })).rejects.toThrow(ConflictException);
    });
  });

  describe('findOrCreateByName', () => {
    it('trả về document có sẵn nếu đã tồn tại, không tạo trùng', async () => {
      const existing = { slug: 'han-quoc' };
      countryModel.findOne.mockReturnValue(execResolves(existing));

      const result = await service.findOrCreateByName('Hàn Quốc');

      expect(result).toBe(existing);
      expect(countryModel.create).not.toHaveBeenCalled();
    });

    it('tạo mới nếu chưa tồn tại', async () => {
      countryModel.findOne.mockReturnValue(execResolves(null));
      countryModel.create.mockResolvedValue({ slug: 'nhat-ban' });

      await service.findOrCreateByName('Nhật Bản');

      expect(countryModel.create).toHaveBeenCalledWith({ name: 'Nhật Bản', slug: 'nhat-ban' });
    });
  });

  describe('remove', () => {
    it('ném NotFoundException khi không tìm thấy quốc gia', async () => {
      countryModel.findByIdAndDelete.mockReturnValue(execResolves(null));

      await expect(service.remove('missing')).rejects.toThrow(NotFoundException);
    });
  });
});
