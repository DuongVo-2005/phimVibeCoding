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
    it('người dùng thường (isAdmin=false) luôn bị ép lọc isPublished:true, bỏ qua query.isPublished', async () => {
      const chain = findChain();
      filmModel.find.mockReturnValue(chain);
      filmModel.countDocuments.mockReturnValue(execResolves(0));

      await service.findAll(
        { page: 1, limit: 20, sortOrder: 'desc', isPublished: false, skip: 0 } as any,
        false,
      );

      expect(filmModel.find).toHaveBeenCalledWith(expect.objectContaining({ isPublished: true }));
    });

    it('admin không truyền isPublished -> không lọc, thấy cả phim ẩn', async () => {
      const chain = findChain();
      filmModel.find.mockReturnValue(chain);
      filmModel.countDocuments.mockReturnValue(execResolves(0));

      await service.findAll({ page: 1, limit: 20, sortOrder: 'desc', skip: 0 } as any, true);

      const calledFilter = filmModel.find.mock.calls[0][0];
      expect(calledFilter).not.toHaveProperty('isPublished');
    });

    it('admin truyền isPublished=false -> lọc đúng theo giá trị đó', async () => {
      const chain = findChain();
      filmModel.find.mockReturnValue(chain);
      filmModel.countDocuments.mockReturnValue(execResolves(0));

      await service.findAll(
        { page: 1, limit: 20, sortOrder: 'desc', isPublished: false, skip: 0 } as any,
        true,
      );

      expect(filmModel.find).toHaveBeenCalledWith(expect.objectContaining({ isPublished: false }));
    });

    it('lọc theo query.format (single/series) — không đụng field categories', async () => {
      const chain = findChain();
      filmModel.find.mockReturnValue(chain);
      filmModel.countDocuments.mockReturnValue(execResolves(0));

      await service.findAll(
        { page: 1, limit: 20, sortOrder: 'desc', format: 'series', skip: 0 } as any,
        false,
      );

      expect(filmModel.find).toHaveBeenCalledWith(expect.objectContaining({ category: 'series' }));
    });

    it('lọc theo query.category (slug thể loại, tên mới) — resolve ObjectId từ collection categories', async () => {
      const categoryId = new Types.ObjectId();
      categoriesCollection.findOne.mockResolvedValue({ _id: categoryId, slug: 'hanh-dong' });
      const chain = findChain();
      filmModel.find.mockReturnValue(chain);
      filmModel.countDocuments.mockReturnValue(execResolves(0));

      await service.findAll(
        { page: 1, limit: 20, sortOrder: 'desc', category: 'hanh-dong', skip: 0 } as any,
        false,
      );

      expect(categoriesCollection.findOne).toHaveBeenCalledWith({ slug: 'hanh-dong' });
      expect(filmModel.find).toHaveBeenCalledWith(
        expect.objectContaining({ categories: categoryId }),
      );
    });

    it('lọc theo query.type (alias tương thích ngược của category) — cùng hành vi', async () => {
      const categoryId = new Types.ObjectId();
      categoriesCollection.findOne.mockResolvedValue({ _id: categoryId, slug: 'hanh-dong' });
      const chain = findChain();
      filmModel.find.mockReturnValue(chain);
      filmModel.countDocuments.mockReturnValue(execResolves(0));

      await service.findAll(
        { page: 1, limit: 20, sortOrder: 'desc', type: 'hanh-dong', skip: 0 } as any,
        false,
      );

      expect(categoriesCollection.findOne).toHaveBeenCalledWith({ slug: 'hanh-dong' });
      expect(filmModel.find).toHaveBeenCalledWith(
        expect.objectContaining({ categories: categoryId }),
      );
    });

    it('query.category được ưu tiên hơn query.type nếu cả hai cùng được truyền', async () => {
      const chain = findChain();
      filmModel.find.mockReturnValue(chain);
      filmModel.countDocuments.mockReturnValue(execResolves(0));

      await service.findAll(
        {
          page: 1,
          limit: 20,
          sortOrder: 'desc',
          category: 'hanh-dong',
          type: 'hai-huoc',
          skip: 0,
        } as any,
        false,
      );

      expect(categoriesCollection.findOne).toHaveBeenCalledWith({ slug: 'hanh-dong' });
    });

    it('lọc theo slug quốc gia — resolve ObjectId thật từ collection countries', async () => {
      const countryId = new Types.ObjectId();
      countriesCollection.findOne.mockResolvedValue({ _id: countryId, slug: 'han-quoc' });
      const chain = findChain();
      filmModel.find.mockReturnValue(chain);
      filmModel.countDocuments.mockReturnValue(execResolves(0));

      await service.findAll(
        { page: 1, limit: 20, sortOrder: 'desc', country: 'han-quoc', skip: 0 } as any,
        false,
      );

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

      await service.findAll(
        {
          page: 1,
          limit: 20,
          sortOrder: 'desc',
          country: 'khong-ton-tai',
          skip: 0,
        } as any,
        false,
      );

      const calledFilter = filmModel.find.mock.calls[0][0];
      expect(calledFilter.countries).toBeInstanceOf(Types.ObjectId);
    });

    it('lọc theo slug đạo diễn — resolve ObjectId thật từ collection directors', async () => {
      const directorId = new Types.ObjectId();
      directorsCollection.findOne.mockResolvedValue({ _id: directorId, slug: 'vuong-gia-ve' });
      const chain = findChain();
      filmModel.find.mockReturnValue(chain);
      filmModel.countDocuments.mockReturnValue(execResolves(0));

      await service.findAll(
        {
          page: 1,
          limit: 20,
          sortOrder: 'desc',
          director: 'vuong-gia-ve',
          skip: 0,
        } as any,
        false,
      );

      expect(directorsCollection.findOne).toHaveBeenCalledWith({ slug: 'vuong-gia-ve' });
      expect(filmModel.find).toHaveBeenCalledWith(
        expect.objectContaining({ directors: directorId }),
      );
    });

    it('populate cả countries lẫn directors bên cạnh categories', async () => {
      const chain = findChain();
      filmModel.find.mockReturnValue(chain);
      filmModel.countDocuments.mockReturnValue(execResolves(0));

      await service.findAll({ page: 1, limit: 20, sortOrder: 'desc', skip: 0 } as any, false);

      expect(chain.populate).toHaveBeenCalledWith('categories', 'name slug');
      expect(chain.populate).toHaveBeenCalledWith('countries', 'name slug');
      expect(chain.populate).toHaveBeenCalledWith('directors', 'name slug');
    });
  });

  describe('findBySlug', () => {
    it('populate countries/directors/categories bên cạnh actors, luôn lọc isPublished:true', async () => {
      const chain: any = {};
      chain.populate = jest.fn().mockReturnValue(chain);
      chain.exec = jest.fn().mockResolvedValue({ slug: 'phim-a' });
      filmModel.findOne.mockReturnValue(chain);

      await service.findBySlug('phim-a');

      expect(filmModel.findOne).toHaveBeenCalledWith({ slug: 'phim-a', isPublished: true });
      expect(chain.populate).toHaveBeenCalledWith('actors', 'name slug avatar');
      expect(chain.populate).toHaveBeenCalledWith('categories', 'name slug');
      expect(chain.populate).toHaveBeenCalledWith('countries', 'name slug');
      expect(chain.populate).toHaveBeenCalledWith('directors', 'name slug');
    });
  });

  describe('findTop', () => {
    it('metric mặc định (view) — sort theo view desc, chỉ phim isPublished', async () => {
      const chain = findChain();
      filmModel.find.mockReturnValue(chain);

      await service.findTop(10);

      expect(filmModel.find).toHaveBeenCalledWith({ isPublished: true });
      expect(chain.sort).toHaveBeenCalledWith({ view: -1 });
    });

    it('metric=ratingAvg — sort theo ratingAvg desc, hoà bằng ratingCount desc', async () => {
      const chain = findChain();
      filmModel.find.mockReturnValue(chain);

      await service.findTop(10, 'ratingAvg');

      expect(chain.sort).toHaveBeenCalledWith({ ratingAvg: -1, ratingCount: -1 });
    });
  });

  describe('findMostCommented', () => {
    it('sort theo commentCount desc, chỉ phim isPublished', async () => {
      const chain = findChain();
      filmModel.find.mockReturnValue(chain);

      await service.findMostCommented(5);

      expect(filmModel.find).toHaveBeenCalledWith({ isPublished: true });
      expect(chain.sort).toHaveBeenCalledWith({ commentCount: -1 });
      expect(chain.limit).toHaveBeenCalledWith(5);
    });
  });

  describe('findHot / findLatestSeries', () => {
    it('findHot chỉ trả về phim isHot + isPublished', async () => {
      const chain = findChain();
      filmModel.find.mockReturnValue(chain);

      await service.findHot(10);

      expect(filmModel.find).toHaveBeenCalledWith({ isHot: true, isPublished: true });
    });

    it('findLatestSeries chỉ trả về phim series + isPublished', async () => {
      const chain = findChain();
      filmModel.find.mockReturnValue(chain);

      await service.findLatestSeries(10);

      expect(filmModel.find).toHaveBeenCalledWith({ category: 'series', isPublished: true });
    });
  });

  describe('findRelated', () => {
    it('lọc theo categories (đổi tên từ types) + isPublished:true, loại trừ chính phim đó', async () => {
      const filmId = new Types.ObjectId();
      const categoryId = new Types.ObjectId();
      filmModel.findOne.mockReturnValue(
        execResolves({ _id: filmId, categories: [categoryId] }),
      );
      const chain = findChain();
      filmModel.find.mockReturnValue(chain);

      await service.findRelated('phim-a', 12);

      expect(filmModel.find).toHaveBeenCalledWith({
        _id: { $ne: filmId },
        categories: { $in: [categoryId] },
        isPublished: true,
      });
    });
  });
});
