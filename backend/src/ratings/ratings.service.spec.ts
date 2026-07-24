import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { FilmsService } from '../films/films.service';
import { RatingsService } from './ratings.service';
import { Rating } from './schemas/rating.schema';

const execResolves = (value: unknown) => ({ exec: jest.fn().mockResolvedValue(value) });

const FILM_ID = '65f1a2b3c4d5e6f7a8b9c0d1';
const USER_ID = '65f1a2b3c4d5e6f7a8b9c0d2';

describe('RatingsService', () => {
  let service: RatingsService;
  let ratingModel: {
    findOneAndUpdate: jest.Mock;
    aggregate: jest.Mock;
    findOne: jest.Mock;
    deleteOne: jest.Mock;
  };
  let filmsService: { recalculateRating: jest.Mock };

  beforeEach(async () => {
    ratingModel = {
      findOneAndUpdate: jest.fn(),
      aggregate: jest.fn(),
      findOne: jest.fn(),
      deleteOne: jest.fn(),
    };
    filmsService = { recalculateRating: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RatingsService,
        { provide: getModelToken(Rating.name), useValue: ratingModel },
        { provide: FilmsService, useValue: filmsService },
      ],
    }).compile();

    service = module.get(RatingsService);
  });

  describe('upsertRating', () => {
    it('upsert theo {film,user} — ép kiểu ObjectId tường minh (fix bug findOneAndUpdate upsert lưu String thay vì ObjectId), sau đó tính lại rating trung bình của phim', async () => {
      const rating = { _id: 'r1', film: FILM_ID, user: USER_ID, score: 8 };
      ratingModel.findOneAndUpdate.mockReturnValue(execResolves(rating));
      ratingModel.aggregate.mockResolvedValue([{ _id: FILM_ID, avg: 8, count: 1 }]);

      const result = await service.upsertRating(USER_ID, FILM_ID, { score: 8 });

      expect(ratingModel.findOneAndUpdate).toHaveBeenCalledWith(
        { film: new Types.ObjectId(FILM_ID), user: new Types.ObjectId(USER_ID) },
        { score: 8 },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );
      const filterArg = ratingModel.findOneAndUpdate.mock.calls[0][0];
      expect(filterArg.film).toBeInstanceOf(Types.ObjectId);
      expect(filterArg.user).toBeInstanceOf(Types.ObjectId);
      expect(filmsService.recalculateRating).toHaveBeenCalledWith(FILM_ID, 8, 1);
      expect(result).toBe(rating);
    });

    it('rate lại cùng phim (cùng user) dùng lại đúng filter upsert (ObjectId), không tạo bản ghi mới', async () => {
      ratingModel.findOneAndUpdate.mockReturnValue(execResolves({ _id: 'r1', score: 5 }));
      ratingModel.aggregate.mockResolvedValue([{ _id: FILM_ID, avg: 5, count: 1 }]);

      await service.upsertRating(USER_ID, FILM_ID, { score: 3 });
      await service.upsertRating(USER_ID, FILM_ID, { score: 5 });

      expect(ratingModel.findOneAndUpdate).toHaveBeenCalledTimes(2);
      expect(ratingModel.findOneAndUpdate.mock.calls[0][0]).toEqual({
        film: new Types.ObjectId(FILM_ID),
        user: new Types.ObjectId(USER_ID),
      });
      expect(ratingModel.findOneAndUpdate.mock.calls[1][0]).toEqual({
        film: new Types.ObjectId(FILM_ID),
        user: new Types.ObjectId(USER_ID),
      });
    });
  });

  describe('getFilmRatingSummary', () => {
    it('trả về {average:0, count:0} khi phim chưa có rating nào', async () => {
      ratingModel.aggregate.mockResolvedValue([]);

      const result = await service.getFilmRatingSummary(FILM_ID);

      expect(result).toEqual({ average: 0, count: 0 });
    });

    it('trả về avg/count từ kết quả aggregate khi đã có rating', async () => {
      ratingModel.aggregate.mockResolvedValue([{ _id: FILM_ID, avg: 7.5, count: 4 }]);

      const result = await service.getFilmRatingSummary(FILM_ID);

      expect(result).toEqual({ average: 7.5, count: 4 });
    });
  });

  describe('getMyRating', () => {
    it('trả về rating của đúng user đó cho phim đó — filter ép kiểu ObjectId (cùng bản sửa với upsertRating)', async () => {
      const rating = { _id: 'r1', score: 9 };
      ratingModel.findOne.mockReturnValue(execResolves(rating));

      const result = await service.getMyRating(USER_ID, FILM_ID);

      expect(ratingModel.findOne).toHaveBeenCalledWith({
        film: new Types.ObjectId(FILM_ID),
        user: new Types.ObjectId(USER_ID),
      });
      expect(result).toBe(rating);
    });

    it('trả về null nếu user chưa đánh giá phim này', async () => {
      ratingModel.findOne.mockReturnValue(execResolves(null));

      const result = await service.getMyRating(USER_ID, FILM_ID);

      expect(result).toBeNull();
    });
  });

  describe('removeRating', () => {
    it('xoá đúng rating của user (filter ép kiểu ObjectId) rồi tính lại rating trung bình của phim', async () => {
      ratingModel.deleteOne.mockReturnValue(execResolves({ deletedCount: 1 }));
      ratingModel.aggregate.mockResolvedValue([]);

      await service.removeRating(USER_ID, FILM_ID);

      expect(ratingModel.deleteOne).toHaveBeenCalledWith({
        film: new Types.ObjectId(FILM_ID),
        user: new Types.ObjectId(USER_ID),
      });
      expect(filmsService.recalculateRating).toHaveBeenCalledWith(FILM_ID, 0, 0);
    });
  });
});
