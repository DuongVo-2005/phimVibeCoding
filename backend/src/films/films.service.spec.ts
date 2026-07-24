import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { FilmsService } from './films.service';
import { Film } from './schemas/film.schema';

const execResolves = (value: unknown) => ({ exec: jest.fn().mockResolvedValue(value) });

const findChain = () => {
  const chain: any = {};
  ['populate', 'sort', 'skip', 'limit'].forEach((method) => {
    chain[method] = jest.fn().mockReturnValue(chain);
  });
  chain.exec = jest.fn().mockResolvedValue([]);
  return chain;
};

describe('FilmsService', () => {
  let service: FilmsService;
  let filmModel: {
    find: jest.Mock;
    findOne: jest.Mock;
    countDocuments: jest.Mock;
    db: { collection: jest.Mock };
  };
  let countriesCollection: { findOne: jest.Mock };
  let directorsCollection: { findOne: jest.Mock };
  let categoriesCollection: { findOne: jest.Mock };

  beforeEach(async () => {
    countriesCollection = { findOne: jest.fn().mockResolvedValue(null) };
    directorsCollection = { findOne: jest.fn().mockResolvedValue(null) };
    categoriesCollection = { findOne: jest.fn().mockResolvedValue(null) };

    filmModel = {
      find: jest.fn(),
      findOne: jest.fn(),
      countDocuments: jest.fn(),
      db: {
        collection: jest.fn((name: string) => {
          if (name === 'countries') return countriesCollection;
          if (name === 'directors') return directorsCollection;
          if (name === 'categories') return categoriesCollection;
          throw new Error(`unexpected collection: ${name}`);
        }),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [FilmsService, { provide: getModelToken(Film.name), useValue: filmModel }],
    }).compile();

    service = module.get(FilmsService);
  });

  describe('findAll', () => {
    it('lọc theo slug quốc gia — resolve ObjectId thật từ collection countries', async () => {
      const countryId = new Types.ObjectId();
      countriesCollection.findOne.mockResolvedValue({ _id: countryId, slug: 'han-quoc' });
      const chain = findChain();
      filmModel.find.mockReturnValue(chain);
      filmModel.countDocuments.mockReturnValue(execResolves(0));

      await service.findAll({ page: 1, limit: 20, sortOrder: 'desc', country: 'han-quoc', skip: 0 } as any);

      expect(countriesCollection.findOne).toHaveBeenCalledWith({ slug: 'han-quoc' });
      expect(filmModel.find).toHaveBeenCalledWith(
        expect.objectContaining({ countries: countryId }),
      );
    });

    it('slug quốc gia không tồn tại — dùng ObjectId ngẫu nhiên để không khớp phim nào', async () => {
      countriesCollection.findOne.mockResolvedValue(null);
      const chain = findChain();
      filmModel.find.mockReturnValue(chain);
      filmModel.countDocuments.mockReturnValue(execResolves(0));

      await service.findAll({
        page: 1,
        limit: 20,
        sortOrder: 'desc',
        country: 'khong-ton-tai',
        skip: 0,
      } as any);

      const calledFilter = filmModel.find.mock.calls[0][0];
      expect(calledFilter.countries).toBeInstanceOf(Types.ObjectId);
    });

    it('lọc theo slug đạo diễn — resolve ObjectId thật từ collection directors', async () => {
      const directorId = new Types.ObjectId();
      directorsCollection.findOne.mockResolvedValue({ _id: directorId, slug: 'vuong-gia-ve' });
      const chain = findChain();
      filmModel.find.mockReturnValue(chain);
      filmModel.countDocuments.mockReturnValue(execResolves(0));

      await service.findAll({
        page: 1,
        limit: 20,
        sortOrder: 'desc',
        director: 'vuong-gia-ve',
        skip: 0,
      } as any);

      expect(directorsCollection.findOne).toHaveBeenCalledWith({ slug: 'vuong-gia-ve' });
      expect(filmModel.find).toHaveBeenCalledWith(
        expect.objectContaining({ directors: directorId }),
      );
    });

    it('populate cả countries lẫn directors bên cạnh types', async () => {
      const chain = findChain();
      filmModel.find.mockReturnValue(chain);
      filmModel.countDocuments.mockReturnValue(execResolves(0));

      await service.findAll({ page: 1, limit: 20, sortOrder: 'desc', skip: 0 } as any);

      expect(chain.populate).toHaveBeenCalledWith('types', 'name slug');
      expect(chain.populate).toHaveBeenCalledWith('countries', 'name slug');
      expect(chain.populate).toHaveBeenCalledWith('directors', 'name slug');
    });
  });

  describe('findBySlug', () => {
    it('populate countries/directors bên cạnh actors/types', async () => {
      const chain: any = {};
      ['populate'].forEach(() => undefined);
      chain.populate = jest.fn().mockReturnValue(chain);
      chain.exec = jest.fn().mockResolvedValue({ slug: 'phim-a' });
      filmModel.findOne.mockReturnValue(chain);

      await service.findBySlug('phim-a');

      expect(chain.populate).toHaveBeenCalledWith('actors', 'name slug avatar');
      expect(chain.populate).toHaveBeenCalledWith('types', 'name slug');
      expect(chain.populate).toHaveBeenCalledWith('countries', 'name slug');
      expect(chain.populate).toHaveBeenCalledWith('directors', 'name slug');
    });
  });
});
