import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { FavoriteTargetType } from '../common/constants';
import { Actor } from '../actors/schemas/actor.schema';
import { Film } from '../films/schemas/film.schema';
import { FavoritesService } from './favorites.service';
import { Favorite } from './schemas/favorite.schema';

const execResolves = (value: unknown) => ({ exec: jest.fn().mockResolvedValue(value) });

describe('FavoritesService', () => {
  let service: FavoritesService;
  let favoriteModel: {
    findOne: jest.Mock;
    create: jest.Mock;
    findOneAndDelete: jest.Mock;
    find: jest.Mock;
    countDocuments: jest.Mock;
  };
  let filmModel: { find: jest.Mock };
  let actorModel: { find: jest.Mock };

  beforeEach(async () => {
    favoriteModel = {
      findOne: jest.fn(),
      create: jest.fn(),
      findOneAndDelete: jest.fn(),
      find: jest.fn(),
      countDocuments: jest.fn(),
    };
    filmModel = { find: jest.fn() };
    actorModel = { find: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FavoritesService,
        { provide: getModelToken(Favorite.name), useValue: favoriteModel },
        { provide: getModelToken(Film.name), useValue: filmModel },
        { provide: getModelToken(Actor.name), useValue: actorModel },
      ],
    }).compile();

    service = module.get(FavoritesService);
  });

  describe('add', () => {
    it('tạo mới khi chưa tồn tại', async () => {
      favoriteModel.findOne.mockReturnValue(execResolves(null));
      const created = { _id: 'fav-1' };
      favoriteModel.create.mockResolvedValue(created);

      const result = await service.add('user-1', {
        targetType: FavoriteTargetType.FILM,
        target: 'film-1',
      });

      expect(favoriteModel.findOne).toHaveBeenCalledWith({
        user: 'user-1',
        targetType: FavoriteTargetType.FILM,
        target: 'film-1',
      });
      expect(favoriteModel.create).toHaveBeenCalledWith({
        user: 'user-1',
        targetType: FavoriteTargetType.FILM,
        target: 'film-1',
      });
      expect(result).toBe(created);
    });

    it('idempotent — thêm lại mục đã yêu thích trả về bản ghi có sẵn, không tạo trùng (không throw 409)', async () => {
      const existing = { _id: 'fav-1' };
      favoriteModel.findOne.mockReturnValue(execResolves(existing));

      const result = await service.add('user-1', {
        targetType: FavoriteTargetType.FILM,
        target: 'film-1',
      });

      expect(result).toBe(existing);
      expect(favoriteModel.create).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('ném NotFoundException khi không tìm thấy mục yêu thích', async () => {
      favoriteModel.findOneAndDelete.mockReturnValue(execResolves(null));

      await expect(
        service.remove('user-1', FavoriteTargetType.FILM, 'film-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('chỉ xoá bản ghi thuộc đúng user (scoped theo userId, không cho xoá của người khác)', async () => {
      favoriteModel.findOneAndDelete.mockReturnValue(execResolves({ _id: 'fav-1' }));

      await service.remove('user-1', FavoriteTargetType.FILM, 'film-1');

      expect(favoriteModel.findOneAndDelete).toHaveBeenCalledWith({
        user: 'user-1',
        targetType: FavoriteTargetType.FILM,
        target: 'film-1',
      });
    });
  });

  describe('findMine', () => {
    it('targetType=film — resolve target qua filmModel, không đụng tới actorModel', async () => {
      const filmId = new Types.ObjectId();
      const favorite = {
        _id: 'fav-1',
        targetType: FavoriteTargetType.FILM,
        target: filmId,
        createdAt: new Date('2026-01-01'),
      };
      const sort = jest.fn().mockReturnValue({
        skip: jest.fn().mockReturnValue({ limit: jest.fn().mockReturnValue(execResolves([favorite])) }),
      });
      favoriteModel.find.mockReturnValue({ sort });
      favoriteModel.countDocuments.mockReturnValue(execResolves(1));
      const film = { _id: filmId, title: 'Phim A' };
      filmModel.find.mockReturnValue(execResolves([film]));

      const result = await service.findMine('user-1', FavoriteTargetType.FILM, {
        page: 1,
        limit: 20,
        skip: 0,
      } as any);

      expect(favoriteModel.find).toHaveBeenCalledWith({
        user: 'user-1',
        targetType: FavoriteTargetType.FILM,
      });
      expect(filmModel.find).toHaveBeenCalledWith({ _id: { $in: [filmId] } });
      expect(actorModel.find).not.toHaveBeenCalled();
      expect(result.items).toHaveLength(1);
      expect(result.items[0].target).toBe(film);
      expect(result.meta.totalItems).toBe(1);
    });

    it('targetType=actor — resolve target qua actorModel, không đụng tới filmModel', async () => {
      const actorId = new Types.ObjectId();
      const favorite = {
        _id: 'fav-2',
        targetType: FavoriteTargetType.ACTOR,
        target: actorId,
        createdAt: new Date('2026-01-01'),
      };
      const sort = jest.fn().mockReturnValue({
        skip: jest.fn().mockReturnValue({ limit: jest.fn().mockReturnValue(execResolves([favorite])) }),
      });
      favoriteModel.find.mockReturnValue({ sort });
      favoriteModel.countDocuments.mockReturnValue(execResolves(1));
      const actor = { _id: actorId, name: 'Diễn Viên A' };
      actorModel.find.mockReturnValue(execResolves([actor]));

      const result = await service.findMine('user-1', FavoriteTargetType.ACTOR, {
        page: 1,
        limit: 20,
        skip: 0,
      } as any);

      expect(actorModel.find).toHaveBeenCalledWith({ _id: { $in: [actorId] } });
      expect(filmModel.find).not.toHaveBeenCalled();
      expect(result.items[0].target).toBe(actor);
    });

    it('target trả về null nếu Film/Actor gốc đã bị xoá (không lỗi, không loại bỏ mục yêu thích)', async () => {
      const filmId = new Types.ObjectId();
      const favorite = {
        _id: 'fav-1',
        targetType: FavoriteTargetType.FILM,
        target: filmId,
        createdAt: new Date('2026-01-01'),
      };
      const sort = jest.fn().mockReturnValue({
        skip: jest.fn().mockReturnValue({ limit: jest.fn().mockReturnValue(execResolves([favorite])) }),
      });
      favoriteModel.find.mockReturnValue({ sort });
      favoriteModel.countDocuments.mockReturnValue(execResolves(1));
      filmModel.find.mockReturnValue(execResolves([]));

      const result = await service.findMine('user-1', FavoriteTargetType.FILM, {
        page: 1,
        limit: 20,
        skip: 0,
      } as any);

      expect(result.items[0].target).toBeNull();
    });
  });
});
