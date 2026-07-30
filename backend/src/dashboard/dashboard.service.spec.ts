import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { FavoriteTargetType } from '../common/constants';
import { FilmsService } from '../films/films.service';
import { Actor } from '../actors/schemas/actor.schema';
import { Category } from '../categories/schemas/category.schema';
import { Comment } from '../comments/schemas/comment.schema';
import { Country } from '../countries/schemas/country.schema';
import { Director } from '../directors/schemas/director.schema';
import { Favorite } from '../favorites/schemas/favorite.schema';
import { Film } from '../films/schemas/film.schema';
import { Playlist } from '../playlists/schemas/playlist.schema';
import { Rating } from '../ratings/schemas/rating.schema';
import { User } from '../users/schemas/user.schema';
import { DashboardService } from './dashboard.service';

const execResolves = (value: unknown) => ({ exec: jest.fn().mockResolvedValue(value) });

/** Mongoose query thật cho phép chain `.select().sort().limit().populate().lean()` theo bất kỳ
 * thứ tự nào trước khi `.exec()` — mock trả về chính nó ở mọi method chain, chỉ `.exec()` resolve
 * giá trị cuối. */
function chainable(value: unknown) {
  const query: Record<string, jest.Mock> = {};
  const methods = ['select', 'sort', 'limit', 'populate', 'lean'];
  for (const method of methods) {
    query[method] = jest.fn().mockReturnValue(query);
  }
  query.exec = jest.fn().mockResolvedValue(value);
  return query;
}

function countModel(...values: number[]) {
  const countDocuments = jest.fn();
  values.forEach((value) => countDocuments.mockReturnValueOnce(execResolves(value)));
  return { countDocuments, aggregate: jest.fn(), find: jest.fn() };
}

describe('DashboardService', () => {
  let service: DashboardService;
  let userModel: ReturnType<typeof countModel>;
  let filmModel: ReturnType<typeof countModel>;
  let categoryModel: ReturnType<typeof countModel>;
  let countryModel: ReturnType<typeof countModel>;
  let actorModel: ReturnType<typeof countModel>;
  let directorModel: ReturnType<typeof countModel>;
  let commentModel: ReturnType<typeof countModel>;
  let ratingModel: ReturnType<typeof countModel>;
  let favoriteModel: ReturnType<typeof countModel>;
  let playlistModel: ReturnType<typeof countModel>;
  let filmsService: { findTop: jest.Mock };

  beforeEach(async () => {
    userModel = countModel(0, 0);
    filmModel = countModel(0, 0);
    categoryModel = countModel(0);
    countryModel = countModel(0);
    actorModel = countModel(0);
    directorModel = countModel(0);
    commentModel = countModel(0);
    ratingModel = countModel(0);
    favoriteModel = countModel(0);
    playlistModel = countModel(0);
    filmsService = { findTop: jest.fn().mockResolvedValue([]) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: getModelToken(User.name), useValue: userModel },
        { provide: getModelToken(Film.name), useValue: filmModel },
        { provide: getModelToken(Category.name), useValue: categoryModel },
        { provide: getModelToken(Country.name), useValue: countryModel },
        { provide: getModelToken(Actor.name), useValue: actorModel },
        { provide: getModelToken(Director.name), useValue: directorModel },
        { provide: getModelToken(Comment.name), useValue: commentModel },
        { provide: getModelToken(Rating.name), useValue: ratingModel },
        { provide: getModelToken(Favorite.name), useValue: favoriteModel },
        { provide: getModelToken(Playlist.name), useValue: playlistModel },
        { provide: FilmsService, useValue: filmsService },
      ],
    }).compile();

    service = module.get(DashboardService);
  });

  describe('getOverview', () => {
    it('tổng hợp đúng từng số liệu từ countDocuments của từng collection + draftMovies = total - published', async () => {
      userModel.countDocuments
        .mockReset()
        .mockReturnValueOnce(execResolves(10))
        .mockReturnValueOnce(execResolves(7));
      filmModel.countDocuments
        .mockReset()
        .mockReturnValueOnce(execResolves(100))
        .mockReturnValueOnce(execResolves(90));
      filmModel.aggregate.mockReturnValue(execResolves([{ _id: null, total: 12345 }]));
      categoryModel.countDocuments.mockReset().mockReturnValueOnce(execResolves(5));
      countryModel.countDocuments.mockReset().mockReturnValueOnce(execResolves(6));
      actorModel.countDocuments.mockReset().mockReturnValueOnce(execResolves(7));
      directorModel.countDocuments.mockReset().mockReturnValueOnce(execResolves(8));
      commentModel.countDocuments.mockReset().mockReturnValueOnce(execResolves(9));
      ratingModel.countDocuments.mockReset().mockReturnValueOnce(execResolves(11));
      favoriteModel.countDocuments.mockReset().mockReturnValueOnce(execResolves(12));
      playlistModel.countDocuments.mockReset().mockReturnValueOnce(execResolves(13));

      const result = await service.getOverview();

      expect(result).toEqual({
        totalUsers: 10,
        activeUsers: 7,
        totalMovies: 100,
        publishedMovies: 90,
        draftMovies: 10,
        categories: 5,
        countries: 6,
        actors: 7,
        directors: 8,
        comments: 9,
        ratings: 11,
        favorites: 12,
        playlists: 13,
        totalViews: 12345,
      });
    });

    it('totalViews = 0 khi collection films rỗng (aggregate trả về mảng rỗng, không có _id:null)', async () => {
      filmModel.aggregate.mockReturnValue(execResolves([]));

      const result = await service.getOverview();

      expect(result.totalViews).toBe(0);
    });
  });

  describe('getCharts', () => {
    beforeEach(() => {
      jest.useFakeTimers().setSystemTime(new Date('2026-07-15T00:00:00.000Z'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('trả về đủ N tháng liên tiếp (skeleton) — tháng không có bản ghi hiện count:0 thay vì bị thiếu', async () => {
      userModel.aggregate.mockReturnValue(execResolves([{ _id: '2026-07', count: 3 }]));
      filmModel.aggregate.mockReturnValue(execResolves([]));
      commentModel.aggregate.mockReturnValue(execResolves([{ _id: '2026-06', count: 2 }]));

      const result = await service.getCharts(3);

      expect(result.newUsers).toEqual([
        { period: '2026-05', count: 0 },
        { period: '2026-06', count: 0 },
        { period: '2026-07', count: 3 },
      ]);
      expect(result.moviesCreated).toEqual([
        { period: '2026-05', count: 0 },
        { period: '2026-06', count: 0 },
        { period: '2026-07', count: 0 },
      ]);
      expect(result.comments).toEqual([
        { period: '2026-05', count: 0 },
        { period: '2026-06', count: 2 },
        { period: '2026-07', count: 0 },
      ]);
    });
  });

  describe('getTopLists', () => {
    it('mostViewed/highestRated tái dùng FilmsService.findTop() đúng metric — không tự viết lại logic sort', async () => {
      filmsService.findTop.mockResolvedValueOnce([
        {
          _id: 'f1',
          slug: 'a',
          title: 'A',
          posterUrl: '',
          view: 100,
          ratingAvg: 0,
          ratingCount: 0,
        },
      ]);
      filmsService.findTop.mockResolvedValueOnce([
        { _id: 'f2', slug: 'b', title: 'B', posterUrl: '', view: 0, ratingAvg: 9, ratingCount: 5 },
      ]);
      favoriteModel.aggregate.mockReturnValue(execResolves([]));

      const result = await service.getTopLists(5);

      expect(filmsService.findTop).toHaveBeenNthCalledWith(1, 5, 'view');
      expect(filmsService.findTop).toHaveBeenNthCalledWith(2, 5, 'ratingAvg');
      expect(result.mostViewedMovies).toEqual([
        { id: 'f1', slug: 'a', title: 'A', posterUrl: '', view: 100, ratingAvg: 0, ratingCount: 0 },
      ]);
      expect(result.highestRatedMovies).toEqual([
        { id: 'f2', slug: 'b', title: 'B', posterUrl: '', view: 0, ratingAvg: 9, ratingCount: 5 },
      ]);
    });

    it('mostFavorited: $match theo targetType=film và $group dùng $toObjectId (fix bug target lưu String thay vì ObjectId khiến $lookup không khớp — QA thực tế đã phát hiện)', async () => {
      favoriteModel.aggregate.mockReturnValue(execResolves([]));

      await service.getTopLists(5);

      const pipeline = favoriteModel.aggregate.mock.calls[0][0];
      expect(pipeline[0]).toEqual({ $match: { targetType: FavoriteTargetType.FILM } });
      expect(pipeline[1]).toEqual({
        $group: { _id: { $toObjectId: '$target' }, favoriteCount: { $sum: 1 } },
      });
    });

    it('map đúng favoriteCount vào từng phim trong mostFavoritedMovies', async () => {
      favoriteModel.aggregate.mockReturnValue(
        execResolves([
          {
            _id: 'f3',
            favoriteCount: 6,
            film: {
              _id: 'f3',
              slug: 'c',
              title: 'C',
              posterUrl: '',
              view: 1,
              ratingAvg: 2,
              ratingCount: 3,
            },
          },
        ]),
      );

      const result = await service.getTopLists(5);

      expect(result.mostFavoritedMovies).toEqual([
        {
          id: 'f3',
          slug: 'c',
          title: 'C',
          posterUrl: '',
          view: 1,
          ratingAvg: 2,
          ratingCount: 3,
          favoriteCount: 6,
        },
      ]);
    });
  });

  describe('getRecentActivity', () => {
    it('map newUsers/latestMovies/latestComments đúng shape, xử lý user/film null khi populate không tìm thấy (đã bị xoá)', async () => {
      userModel.find.mockReturnValue(
        chainable([
          { _id: 'u1', name: 'Alice', email: 'a@test.com', createdAt: new Date('2026-01-01') },
        ]),
      );
      filmModel.find.mockReturnValue(
        chainable([
          {
            _id: 'f1',
            slug: 'a',
            title: 'A',
            posterUrl: '',
            view: 1,
            ratingAvg: 0,
            ratingCount: 0,
          },
        ]),
      );
      commentModel.find.mockReturnValue(
        chainable([
          {
            _id: 'c1',
            content: 'hello',
            user: { _id: 'u1', name: 'Alice', email: 'a@test.com' },
            film: null,
            createdAt: new Date('2026-01-02'),
          },
        ]),
      );

      const result = await service.getRecentActivity(5);

      expect(result.newUsers).toEqual([
        { id: 'u1', name: 'Alice', email: 'a@test.com', createdAt: new Date('2026-01-01') },
      ]);
      expect(result.latestMovies).toEqual([
        { id: 'f1', slug: 'a', title: 'A', posterUrl: '', view: 1, ratingAvg: 0, ratingCount: 0 },
      ]);
      expect(result.latestComments).toEqual([
        {
          id: 'c1',
          content: 'hello',
          user: { id: 'u1', name: 'Alice', email: 'a@test.com' },
          film: null,
          createdAt: new Date('2026-01-02'),
        },
      ]);
    });
  });
});
