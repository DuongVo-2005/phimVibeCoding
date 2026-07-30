import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { FilmsService } from '../films/films.service';
import { EpisodesService } from './episodes.service';
import { Episode } from './schemas/episode.schema';

const execResolves = (value: unknown) => ({ exec: jest.fn().mockResolvedValue(value) });

function chainable(value: unknown) {
  const query: Record<string, jest.Mock> = {};
  query.sort = jest.fn().mockReturnValue(query);
  query.exec = jest.fn().mockResolvedValue(value);
  return query;
}

const FILM_ID = '65f1a2b3c4d5e6f7a8b9c0d1';

function buildEpisode(overrides: Record<string, unknown> = {}) {
  return {
    _id: 'ep-1',
    filmId: new Types.ObjectId(FILM_ID),
    episodeNumber: 1,
    title: 'Tập 1',
    displayOrder: 0,
    ...overrides,
  };
}

describe('EpisodesService', () => {
  let service: EpisodesService;
  let episodeModel: {
    find: jest.Mock;
    findOne: jest.Mock;
    findById: jest.Mock;
    countDocuments: jest.Mock;
    findByIdAndUpdate: jest.Mock;
    findByIdAndDelete: jest.Mock;
    updateMany: jest.Mock;
    create: jest.Mock;
  };
  let filmsService: { findById: jest.Mock };

  beforeEach(async () => {
    episodeModel = {
      find: jest.fn(),
      findOne: jest.fn(),
      findById: jest.fn(),
      countDocuments: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      findByIdAndDelete: jest.fn(),
      updateMany: jest.fn(),
      create: jest.fn(),
    };
    filmsService = { findById: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EpisodesService,
        { provide: getModelToken(Episode.name), useValue: episodeModel },
        { provide: FilmsService, useValue: filmsService },
      ],
    }).compile();

    service = module.get(EpisodesService);
  });

  describe('findByFilm', () => {
    it('sort theo displayOrder tăng dần, lọc đúng filmId (ép ObjectId)', async () => {
      const items = [buildEpisode()];
      const query = chainable(items);
      episodeModel.find.mockReturnValue(query);

      const result = await service.findByFilm(FILM_ID);

      const filterArg = episodeModel.find.mock.calls[0][0];
      expect(filterArg.filmId).toBeInstanceOf(Types.ObjectId);
      expect(filterArg.filmId.toString()).toBe(FILM_ID);
      expect(query.sort).toHaveBeenCalledWith({ displayOrder: 1 });
      expect(result).toBe(items);
    });
  });

  describe('create', () => {
    it('phim không tồn tại -> NotFoundException, KHÔNG kiểm tra trùng/tạo', async () => {
      filmsService.findById.mockResolvedValue(null);

      await expect(
        service.create(FILM_ID, { episodeNumber: 1, title: 'Tập 1' } as any),
      ).rejects.toThrow(NotFoundException);
      expect(episodeModel.findOne).not.toHaveBeenCalled();
      expect(episodeModel.create).not.toHaveBeenCalled();
    });

    it('trùng episodeNumber trong cùng phim -> ConflictException', async () => {
      filmsService.findById.mockResolvedValue({ _id: FILM_ID });
      episodeModel.findOne.mockReturnValue(execResolves(buildEpisode()));
      episodeModel.countDocuments.mockReturnValue(execResolves(1));

      await expect(
        service.create(FILM_ID, { episodeNumber: 1, title: 'Tập 1' } as any),
      ).rejects.toThrow(ConflictException);
      expect(episodeModel.create).not.toHaveBeenCalled();
    });

    it('tạo thành công -> displayOrder = số tập hiện có (append cuối), default rỗng/isPublished=true khi không truyền', async () => {
      filmsService.findById.mockResolvedValue({ _id: FILM_ID });
      episodeModel.findOne.mockReturnValue(execResolves(null));
      episodeModel.countDocuments.mockReturnValue(execResolves(3));
      episodeModel.create.mockResolvedValue(buildEpisode({ displayOrder: 3 }));

      await service.create(FILM_ID, { episodeNumber: 4, title: 'Tập 4' } as any);

      const createArg = episodeModel.create.mock.calls[0][0];
      expect(createArg).toMatchObject({
        episodeNumber: 4,
        title: 'Tập 4',
        embedUrl: '',
        m3u8Url: '',
        subtitleUrl: '',
        duration: '',
        isPublished: true,
        displayOrder: 3,
      });
      expect(createArg.filmId).toBeInstanceOf(Types.ObjectId);
    });

    it('truyền isPublished=false -> lưu đúng false (không bị ?? true ghi đè)', async () => {
      filmsService.findById.mockResolvedValue({ _id: FILM_ID });
      episodeModel.findOne.mockReturnValue(execResolves(null));
      episodeModel.countDocuments.mockReturnValue(execResolves(0));
      episodeModel.create.mockResolvedValue(buildEpisode());

      await service.create(FILM_ID, {
        episodeNumber: 1,
        title: 'Tập 1',
        isPublished: false,
      } as any);

      expect(episodeModel.create).toHaveBeenCalledWith(
        expect.objectContaining({ isPublished: false }),
      );
    });
  });

  describe('update', () => {
    it('không tồn tại -> NotFoundException', async () => {
      episodeModel.findById.mockReturnValue(execResolves(null));

      await expect(service.update('ep-1', { title: 'Mới' } as any)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('không đổi episodeNumber -> KHÔNG kiểm tra trùng, update thẳng', async () => {
      episodeModel.findById.mockReturnValue(execResolves(buildEpisode({ episodeNumber: 2 })));
      episodeModel.findByIdAndUpdate.mockReturnValue(execResolves(buildEpisode({ title: 'Mới' })));

      await service.update('ep-1', { title: 'Mới' } as any);

      expect(episodeModel.findOne).not.toHaveBeenCalled();
      expect(episodeModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'ep-1',
        { title: 'Mới' },
        { new: true },
      );
    });

    it('đổi episodeNumber sang giá trị đã tồn tại (ở tập KHÁC) -> ConflictException', async () => {
      episodeModel.findById.mockReturnValue(execResolves(buildEpisode({ episodeNumber: 2 })));
      episodeModel.findOne.mockReturnValue(execResolves(buildEpisode({ _id: 'ep-2' })));

      await expect(service.update('ep-1', { episodeNumber: 5 } as any)).rejects.toThrow(
        ConflictException,
      );
      expect(episodeModel.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it('đổi episodeNumber sang giá trị mới CHƯA tồn tại -> update thành công', async () => {
      episodeModel.findById.mockReturnValue(execResolves(buildEpisode({ episodeNumber: 2 })));
      episodeModel.findOne.mockReturnValue(execResolves(null));
      episodeModel.findByIdAndUpdate.mockReturnValue(
        execResolves(buildEpisode({ episodeNumber: 5 })),
      );

      const result = await service.update('ep-1', { episodeNumber: 5 } as any);

      expect(result.episodeNumber).toBe(5);
    });
  });

  describe('remove', () => {
    it('không tồn tại -> NotFoundException, KHÔNG dồn lại displayOrder', async () => {
      episodeModel.findByIdAndDelete.mockReturnValue(execResolves(null));

      await expect(service.remove('ep-1')).rejects.toThrow(NotFoundException);
      expect(episodeModel.updateMany).not.toHaveBeenCalled();
    });

    it('xoá thành công -> dồn lại (-1) CHỈ các tập có displayOrder LỚN HƠN tập vừa xoá, trong CÙNG phim', async () => {
      const deleted = buildEpisode({ displayOrder: 2 });
      episodeModel.findByIdAndDelete.mockReturnValue(execResolves(deleted));
      episodeModel.updateMany.mockReturnValue(execResolves({ modifiedCount: 2 }));

      await service.remove('ep-1');

      expect(episodeModel.updateMany).toHaveBeenCalledWith(
        { filmId: deleted.filmId, displayOrder: { $gt: 2 } },
        { $inc: { displayOrder: -1 } },
      );
    });
  });

  describe('updateOrder', () => {
    it('không tồn tại -> NotFoundException', async () => {
      episodeModel.findById.mockReturnValue(execResolves(null));

      await expect(service.updateOrder('ep-1', { displayOrder: 1 })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('displayOrder mới >= tổng số tập -> BadRequestException ("invalid displayOrder")', async () => {
      episodeModel.findById.mockReturnValue(execResolves(buildEpisode({ displayOrder: 0 })));
      episodeModel.countDocuments.mockReturnValue(execResolves(3));

      await expect(service.updateOrder('ep-1', { displayOrder: 3 })).rejects.toThrow(
        BadRequestException,
      );
      expect(episodeModel.updateMany).not.toHaveBeenCalled();
    });

    it('displayOrder không đổi -> no-op, KHÔNG gọi updateMany/findByIdAndUpdate', async () => {
      const episode = buildEpisode({ displayOrder: 1 });
      episodeModel.findById.mockReturnValue(execResolves(episode));
      episodeModel.countDocuments.mockReturnValue(execResolves(3));

      const result = await service.updateOrder('ep-1', { displayOrder: 1 });

      expect(episodeModel.updateMany).not.toHaveBeenCalled();
      expect(episodeModel.findByIdAndUpdate).not.toHaveBeenCalled();
      expect(result).toBe(episode);
    });

    it('di chuyển TIẾN (oldPos=0 -> newPos=2): dịch LÙI (-1) các tập trong (0,2], CHỈ update tối thiểu', async () => {
      const episode = buildEpisode({ displayOrder: 0 });
      episodeModel.findById.mockReturnValue(execResolves(episode));
      episodeModel.countDocuments.mockReturnValue(execResolves(4));
      episodeModel.updateMany.mockReturnValue(execResolves({ modifiedCount: 2 }));
      episodeModel.findByIdAndUpdate.mockReturnValue(
        execResolves(buildEpisode({ displayOrder: 2 })),
      );

      await service.updateOrder('ep-1', { displayOrder: 2 });

      expect(episodeModel.updateMany).toHaveBeenCalledWith(
        { filmId: episode.filmId, displayOrder: { $gt: 0, $lte: 2 } },
        { $inc: { displayOrder: -1 } },
      );
      expect(episodeModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'ep-1',
        { displayOrder: 2 },
        { new: true },
      );
    });

    it('di chuyển LÙI (oldPos=3 -> newPos=1): dịch TIẾN (+1) các tập trong [1,3), CHỈ update tối thiểu', async () => {
      const episode = buildEpisode({ displayOrder: 3 });
      episodeModel.findById.mockReturnValue(execResolves(episode));
      episodeModel.countDocuments.mockReturnValue(execResolves(4));
      episodeModel.updateMany.mockReturnValue(execResolves({ modifiedCount: 2 }));
      episodeModel.findByIdAndUpdate.mockReturnValue(
        execResolves(buildEpisode({ displayOrder: 1 })),
      );

      await service.updateOrder('ep-1', { displayOrder: 1 });

      expect(episodeModel.updateMany).toHaveBeenCalledWith(
        { filmId: episode.filmId, displayOrder: { $gte: 1, $lt: 3 } },
        { $inc: { displayOrder: 1 } },
      );
    });
  });
});
