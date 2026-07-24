import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { HistoriesService } from './histories.service';
import { History } from './schemas/history.schema';

const execResolves = (value: unknown) => ({ exec: jest.fn().mockResolvedValue(value) });

const FILM_ID = '65f1a2b3c4d5e6f7a8b9c0d1';
const USER_ID = '65f1a2b3c4d5e6f7a8b9c0d2';

describe('HistoriesService', () => {
  let service: HistoriesService;
  let historyModel: {
    findOneAndUpdate: jest.Mock;
    find: jest.Mock;
    findOne: jest.Mock;
    findOneAndDelete: jest.Mock;
    countDocuments: jest.Mock;
  };

  beforeEach(async () => {
    historyModel = {
      findOneAndUpdate: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      findOneAndDelete: jest.fn(),
      countDocuments: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HistoriesService,
        { provide: getModelToken(History.name), useValue: historyModel },
      ],
    }).compile();

    service = module.get(HistoriesService);
  });

  describe('upsertProgress', () => {
    it('upsert theo {user,film}, set lastWatchedAt mới, giữ các field khác từ dto', async () => {
      const history = { _id: 'h1' };
      historyModel.findOneAndUpdate.mockReturnValue(execResolves(history));

      const result = await service.upsertProgress(USER_ID, {
        film: FILM_ID,
        episodeSlug: 'tap-1',
        progressSeconds: 120,
      });

      const [filterArg, updateArg, optionsArg] = historyModel.findOneAndUpdate.mock.calls[0];
      expect(filterArg).toEqual({ user: USER_ID, film: FILM_ID });
      expect(updateArg.$set).toMatchObject({ episodeSlug: 'tap-1', progressSeconds: 120 });
      expect(updateArg.$set.lastWatchedAt).toBeInstanceOf(Date);
      expect(optionsArg).toEqual({ upsert: true, new: true, setDefaultsOnInsert: true });
      expect(result).toBe(history);
    });
  });

  describe('findRecent', () => {
    it('lọc theo user, populate film với đầy đủ field bao gồm isPublished', async () => {
      const chain: any = {};
      ['populate', 'sort', 'skip', 'limit'].forEach(
        (m) => (chain[m] = jest.fn().mockReturnValue(chain)),
      );
      chain.exec = jest.fn().mockResolvedValue([]);
      historyModel.find.mockReturnValue(chain);
      historyModel.countDocuments.mockReturnValue(execResolves(0));

      await service.findRecent(USER_ID, { page: 1, limit: 20, skip: 0 } as any);

      expect(historyModel.find).toHaveBeenCalledWith({ user: USER_ID });
      expect(chain.populate).toHaveBeenCalledWith(
        'film',
        'title slug posterUrl thumbUrl episodeCurrent category isPublished',
      );
      expect(chain.sort).toHaveBeenCalledWith({ lastWatchedAt: -1 });
    });
  });

  describe('findByFilm', () => {
    it('trả về lịch sử xem của đúng user + phim', async () => {
      const history = { _id: 'h1' };
      historyModel.findOne.mockReturnValue(execResolves(history));

      const result = await service.findByFilm(USER_ID, FILM_ID);

      expect(historyModel.findOne).toHaveBeenCalledWith({ user: USER_ID, film: FILM_ID });
      expect(result).toBe(history);
    });

    it('trả về null nếu chưa có lịch sử xem', async () => {
      historyModel.findOne.mockReturnValue(execResolves(null));

      const result = await service.findByFilm(USER_ID, FILM_ID);

      expect(result).toBeNull();
    });
  });

  describe('remove', () => {
    it('ném NotFoundException khi không tìm thấy lịch sử xem', async () => {
      historyModel.findOneAndDelete.mockReturnValue(execResolves(null));

      await expect(service.remove(USER_ID, FILM_ID)).rejects.toThrow(NotFoundException);
    });

    it('xoá đúng bản ghi theo {user,film}', async () => {
      historyModel.findOneAndDelete.mockReturnValue(execResolves({ _id: 'h1' }));

      await service.remove(USER_ID, FILM_ID);

      expect(historyModel.findOneAndDelete).toHaveBeenCalledWith({ user: USER_ID, film: FILM_ID });
    });
  });
});
