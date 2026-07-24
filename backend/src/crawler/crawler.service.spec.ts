import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesService } from '../categories/categories.service';
import { FilmsService } from '../films/films.service';
import { CrawlerService } from './crawler.service';
import { OphimClientService } from './ophim-client.service';
import { OphimMapperService } from './ophim-mapper.service';

describe('CrawlerService', () => {
  let service: CrawlerService;
  let ophimClient: { getUpdatedList: jest.Mock; getMovieDetail: jest.Mock };
  let ophimMapper: { mapToFilmData: jest.Mock };
  let filmsService: { upsertBySlug: jest.Mock };
  let categoriesService: { findAll: jest.Mock };

  const OPHIM_CONFIG = {
    baseUrl: 'https://ophim1.com',
    requestConcurrency: 3,
    syncListMaxPages: 3,
  };

  beforeEach(async () => {
    ophimClient = { getUpdatedList: jest.fn(), getMovieDetail: jest.fn() };
    ophimMapper = { mapToFilmData: jest.fn() };
    filmsService = { upsertBySlug: jest.fn() };
    categoriesService = { findAll: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CrawlerService,
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue(OPHIM_CONFIG) },
        },
        { provide: OphimClientService, useValue: ophimClient },
        { provide: OphimMapperService, useValue: ophimMapper },
        { provide: FilmsService, useValue: filmsService },
        { provide: CategoriesService, useValue: categoriesService },
      ],
    }).compile();

    service = module.get(CrawlerService);
  });

  describe('syncFilmDetail', () => {
    const SLUG = 'phim-test';

    it('success: fetch -> map -> save đều thành công -> trả về {success:true, isNew}', async () => {
      ophimClient.getMovieDetail.mockResolvedValue({ movie: { name: 'Phim Test' } });
      ophimMapper.mapToFilmData.mockResolvedValue({ slug: SLUG, name: 'Phim Test' });
      filmsService.upsertBySlug.mockResolvedValue({ film: { slug: SLUG }, isNew: true });

      const result = await service.syncFilmDetail(SLUG);

      expect(result).toEqual({ success: true, isNew: true });
      expect(ophimMapper.mapToFilmData).toHaveBeenCalledWith({ movie: { name: 'Phim Test' } });
      expect(filmsService.upsertBySlug).toHaveBeenCalledWith(SLUG, { slug: SLUG, name: 'Phim Test' });
    });

    it('fetch fail: getMovieDetail trả về null -> {success:false, isNew:false}, không gọi map/save', async () => {
      ophimClient.getMovieDetail.mockResolvedValue(null);

      const result = await service.syncFilmDetail(SLUG);

      expect(result).toEqual({ success: false, isNew: false });
      expect(ophimMapper.mapToFilmData).not.toHaveBeenCalled();
      expect(filmsService.upsertBySlug).not.toHaveBeenCalled();
    });

    it('fetch fail: detail.movie là mảng rỗng (Ophim trả về khi không tìm thấy phim) -> {success:false}', async () => {
      ophimClient.getMovieDetail.mockResolvedValue({ movie: [] });

      const result = await service.syncFilmDetail(SLUG);

      expect(result).toEqual({ success: false, isNew: false });
      expect(ophimMapper.mapToFilmData).not.toHaveBeenCalled();
    });

    it('mapping fail: mapToFilmData ném lỗi -> {success:false, isNew:false}, không gọi save', async () => {
      ophimClient.getMovieDetail.mockResolvedValue({ movie: { name: 'Phim Test' } });
      ophimMapper.mapToFilmData.mockRejectedValue(new Error('mapping error'));

      const result = await service.syncFilmDetail(SLUG);

      expect(result).toEqual({ success: false, isNew: false });
      expect(filmsService.upsertBySlug).not.toHaveBeenCalled();
    });

    it('save fail: upsertBySlug ném lỗi -> {success:false, isNew:false}', async () => {
      ophimClient.getMovieDetail.mockResolvedValue({ movie: { name: 'Phim Test' } });
      ophimMapper.mapToFilmData.mockResolvedValue({ slug: SLUG });
      filmsService.upsertBySlug.mockRejectedValue(new Error('mongo error'));

      const result = await service.syncFilmDetail(SLUG);

      expect(result).toEqual({ success: false, isNew: false });
    });
  });

  describe('syncFilmList', () => {
    it('success: gom slug từ nhiều trang tới khi gặp trang rỗng, tính đúng thống kê added/updated/failed', async () => {
      ophimClient.getUpdatedList
        .mockResolvedValueOnce({ items: [{ slug: 'a' }, { slug: 'b' }] })
        .mockResolvedValueOnce({ items: [{ slug: 'c' }] })
        .mockResolvedValueOnce({ items: [] });

      jest.spyOn(service, 'syncFilmDetail').mockImplementation(async (slug: string) => {
        if (slug === 'a') return { success: true, isNew: true }; // added
        if (slug === 'b') return { success: true, isNew: false }; // updated
        return { success: false, isNew: false }; // failed (c)
      });

      const result = await service.syncFilmList(5);

      expect(result).toEqual({ processed: 3, succeeded: 2, failed: 1, added: 1, updated: 1 });
      expect(ophimClient.getUpdatedList).toHaveBeenCalledTimes(3);
    });

    it('fetch fail: getUpdatedList trả về null ở trang đầu -> dừng ngay, processed=0', async () => {
      ophimClient.getUpdatedList.mockResolvedValue(null);
      const spy = jest.spyOn(service, 'syncFilmDetail');

      const result = await service.syncFilmList(3);

      expect(result).toEqual({ processed: 0, succeeded: 0, failed: 0, added: 0, updated: 0 });
      expect(spy).not.toHaveBeenCalled();
    });

    it('mapping/save fail (qua syncFilmDetail trả success:false) -> tính vào failed, không tính added/updated', async () => {
      ophimClient.getUpdatedList
        .mockResolvedValueOnce({ items: [{ slug: 'fail-1' }, { slug: 'fail-2' }] })
        .mockResolvedValueOnce({ items: [] });

      jest.spyOn(service, 'syncFilmDetail').mockResolvedValue({ success: false, isNew: false });

      const result = await service.syncFilmList(5);

      expect(result).toEqual({ processed: 2, succeeded: 0, failed: 2, added: 0, updated: 0 });
    });

    it('concurrency guard: gọi syncFilmList lần 2 khi lần 1 đang chạy -> trả về ngay kết quả rỗng, không gọi lại getUpdatedList', async () => {
      let resolveFirstPage: (value: unknown) => void;
      const pendingFirstPage = new Promise((resolve) => {
        resolveFirstPage = resolve;
      });
      ophimClient.getUpdatedList.mockReturnValueOnce(pendingFirstPage);

      // syncFilmList chạy đồng bộ tới await đầu tiên (getUpdatedList) trước khi trả quyền điều
      // khiển — nên lệnh gọi thứ 2 ngay sau đó chắc chắn thấy isSyncingList đã là true.
      const firstCall = service.syncFilmList(1);
      const secondCallResult = await service.syncFilmList(1);

      expect(secondCallResult).toEqual({ processed: 0, succeeded: 0, failed: 0, added: 0, updated: 0 });
      expect(ophimClient.getUpdatedList).toHaveBeenCalledTimes(1);

      resolveFirstPage!({ items: [] });
      await firstCall;
    });

    it('sau khi lần chạy trước hoàn tất (kể cả lỗi), cờ isSyncingList được giải phóng cho lần sau', async () => {
      ophimClient.getUpdatedList.mockResolvedValueOnce({ items: [] });
      await service.syncFilmList(1);

      ophimClient.getUpdatedList.mockResolvedValueOnce({ items: [] });
      const result = await service.syncFilmList(1);

      expect(result).toEqual({ processed: 0, succeeded: 0, failed: 0, added: 0, updated: 0 });
      expect(ophimClient.getUpdatedList).toHaveBeenCalledTimes(2);
    });
  });
});
