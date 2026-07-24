import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PlaylistsService } from './playlists.service';
import { Playlist } from './schemas/playlist.schema';

const execResolves = (value: unknown) => ({ exec: jest.fn().mockResolvedValue(value) });

const USER_ID = '65f1a2b3c4d5e6f7a8b9c0d1';
const OTHER_USER_ID = '65f1a2b3c4d5e6f7a8b9c0d2';
const PLAYLIST_ID = '65f1a2b3c4d5e6f7a8b9c0d3';
const FILM_ID = '65f1a2b3c4d5e6f7a8b9c0d4';

describe('PlaylistsService', () => {
  let service: PlaylistsService;
  let playlistModel: {
    create: jest.Mock;
    find: jest.Mock;
    findOne: jest.Mock;
    findOneAndUpdate: jest.Mock;
    findOneAndDelete: jest.Mock;
  };

  beforeEach(async () => {
    playlistModel = {
      create: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      findOneAndUpdate: jest.fn(),
      findOneAndDelete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlaylistsService,
        { provide: getModelToken(Playlist.name), useValue: playlistModel },
      ],
    }).compile();

    service = module.get(PlaylistsService);
  });

  describe('create', () => {
    it('tạo playlist gắn đúng user sở hữu', async () => {
      const created = { _id: PLAYLIST_ID, name: 'Xem sau', user: USER_ID };
      playlistModel.create.mockResolvedValue(created);

      const result = await service.create(USER_ID, { name: 'Xem sau' });

      expect(playlistModel.create).toHaveBeenCalledWith({ name: 'Xem sau', user: USER_ID });
      expect(result).toBe(created);
    });
  });

  describe('findMine', () => {
    it('lọc theo đúng user, sort createdAt desc', async () => {
      const chain = execResolves([]);
      const sort = jest.fn().mockReturnValue(chain);
      playlistModel.find.mockReturnValue({ sort });

      await service.findMine(USER_ID);

      expect(playlistModel.find).toHaveBeenCalledWith({ user: USER_ID });
      expect(sort).toHaveBeenCalledWith({ createdAt: -1 });
    });
  });

  describe('findOne — ownership (chỉ chủ sở hữu mới truy cập được)', () => {
    it('filter theo {_id, user} — không thể lấy playlist của user khác', async () => {
      const chain: any = { populate: jest.fn() };
      chain.populate.mockReturnValue(execResolves(null));
      playlistModel.findOne.mockReturnValue(chain);

      await expect(service.findOne(OTHER_USER_ID, PLAYLIST_ID)).rejects.toThrow(
        NotFoundException,
      );
      expect(playlistModel.findOne).toHaveBeenCalledWith({
        _id: PLAYLIST_ID,
        user: OTHER_USER_ID,
      });
    });

    it('trả về playlist đã populate films khi đúng chủ sở hữu', async () => {
      const playlist = { _id: PLAYLIST_ID, name: 'Xem sau', films: [] };
      const chain: any = { populate: jest.fn() };
      chain.populate.mockReturnValue(execResolves(playlist));
      playlistModel.findOne.mockReturnValue(chain);

      const result = await service.findOne(USER_ID, PLAYLIST_ID);

      expect(chain.populate).toHaveBeenCalledWith(
        'films',
        'title slug posterUrl thumbUrl category episodeCurrent',
      );
      expect(result).toBe(playlist);
    });
  });

  describe('update', () => {
    it('ném NotFoundException khi không phải chủ sở hữu (hoặc không tồn tại)', async () => {
      playlistModel.findOneAndUpdate.mockReturnValue(execResolves(null));

      await expect(
        service.update(OTHER_USER_ID, PLAYLIST_ID, { name: 'Tên mới' }),
      ).rejects.toThrow(NotFoundException);
      expect(playlistModel.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: PLAYLIST_ID, user: OTHER_USER_ID },
        { name: 'Tên mới' },
        { new: true },
      );
    });

    it('cập nhật thành công khi đúng chủ sở hữu', async () => {
      const updated = { _id: PLAYLIST_ID, name: 'Tên mới' };
      playlistModel.findOneAndUpdate.mockReturnValue(execResolves(updated));

      const result = await service.update(USER_ID, PLAYLIST_ID, { name: 'Tên mới' });
      expect(result).toBe(updated);
    });
  });

  describe('remove', () => {
    it('ném NotFoundException khi không phải chủ sở hữu', async () => {
      playlistModel.findOneAndDelete.mockReturnValue(execResolves(null));

      await expect(service.remove(OTHER_USER_ID, PLAYLIST_ID)).rejects.toThrow(
        NotFoundException,
      );
      expect(playlistModel.findOneAndDelete).toHaveBeenCalledWith({
        _id: PLAYLIST_ID,
        user: OTHER_USER_ID,
      });
    });

    it('xoá thành công khi đúng chủ sở hữu', async () => {
      playlistModel.findOneAndDelete.mockReturnValue(execResolves({ _id: PLAYLIST_ID }));

      await expect(service.remove(USER_ID, PLAYLIST_ID)).resolves.toBeUndefined();
    });
  });

  describe('addFilm — $addToSet (tự loại trùng)', () => {
    it('dùng đúng operator $addToSet, filter theo ownership', async () => {
      playlistModel.findOneAndUpdate.mockReturnValue(
        execResolves({ _id: PLAYLIST_ID, films: [FILM_ID] }),
      );

      await service.addFilm(USER_ID, PLAYLIST_ID, FILM_ID);

      expect(playlistModel.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: PLAYLIST_ID, user: USER_ID },
        { $addToSet: { films: FILM_ID } },
        { new: true },
      );
    });

    it('ném NotFoundException khi không phải chủ sở hữu playlist', async () => {
      playlistModel.findOneAndUpdate.mockReturnValue(execResolves(null));

      await expect(service.addFilm(OTHER_USER_ID, PLAYLIST_ID, FILM_ID)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('removeFilm — $pull', () => {
    it('dùng đúng operator $pull, filter theo ownership', async () => {
      playlistModel.findOneAndUpdate.mockReturnValue(
        execResolves({ _id: PLAYLIST_ID, films: [] }),
      );

      await service.removeFilm(USER_ID, PLAYLIST_ID, FILM_ID);

      expect(playlistModel.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: PLAYLIST_ID, user: USER_ID },
        { $pull: { films: FILM_ID } },
        { new: true },
      );
    });

    it('ném NotFoundException khi không phải chủ sở hữu playlist', async () => {
      playlistModel.findOneAndUpdate.mockReturnValue(execResolves(null));

      await expect(service.removeFilm(OTHER_USER_ID, PLAYLIST_ID, FILM_ID)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
