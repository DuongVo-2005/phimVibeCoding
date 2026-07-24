import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { Test, TestingModule } from '@nestjs/testing';
import { of, throwError } from 'rxjs';
import { CrawlerRunStatus } from '../common/constants';
import { CrawlerHistoryService } from '../crawler-history/crawler-history.service';
import { OphimCategorySyncService } from './ophim-category-sync.service';
import { Category } from './schemas/category.schema';

const execResolves = (value: unknown) => ({ exec: jest.fn().mockResolvedValue(value) });

describe('OphimCategorySyncService', () => {
  let service: OphimCategorySyncService;
  let httpService: { get: jest.Mock };
  let categoryModel: { findOne: jest.Mock; create: jest.Mock };
  let crawlerHistoryService: { record: jest.Mock };

  beforeEach(async () => {
    httpService = { get: jest.fn() };
    categoryModel = { findOne: jest.fn(), create: jest.fn() };
    crawlerHistoryService = { record: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OphimCategorySyncService,
        { provide: HttpService, useValue: httpService },
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue({ baseUrl: 'https://ophim1.com' }) },
        },
        { provide: getModelToken(Category.name), useValue: categoryModel },
        { provide: CrawlerHistoryService, useValue: crawlerHistoryService },
      ],
    }).compile();

    service = module.get(OphimCategorySyncService);
  });

  describe('syncAll', () => {
    it('tạo mới danh mục khi chưa tồn tại (theo sourceSlug), với các field admin để trống', async () => {
      httpService.get.mockReturnValue(
        of({ status: 200, data: [{ name: 'Hành Động', slug: 'hanh-dong' }] }),
      );
      categoryModel.findOne.mockReturnValue(execResolves(null));
      categoryModel.create.mockResolvedValue({});

      const result = await service.syncAll();

      expect(result).toEqual({ processed: 1, added: 1, updated: 0, failed: 0 });
      expect(categoryModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Hành Động',
          source: 'ophim',
          sourceSlug: 'hanh-dong',
          isActive: true,
        }),
      );
      expect(crawlerHistoryService.record).toHaveBeenCalledWith(
        expect.objectContaining({ source: 'ophim-categories', status: CrawlerRunStatus.SUCCESS }),
      );
    });

    it('khi cập nhật danh mục đã tồn tại: CHỈ đổi name + sourceUpdatedAt, không đụng slug/description/isActive/isHot', async () => {
      const existing = {
        name: 'Ten Cu',
        slug: 'ten-cu-slug', // admin đã đổi khác sourceSlug
        description: 'Ghi chú admin tự viết',
        isActive: false, // admin đã tắt danh mục này
        isHot: true,
        sourceSlug: 'hanh-dong',
        sourceUpdatedAt: null as Date | null,
        save: jest.fn().mockResolvedValue(undefined),
      };
      httpService.get.mockReturnValue(
        of({ status: 200, data: [{ name: 'Hành Động (Ophim đổi tên)', slug: 'hanh-dong' }] }),
      );
      categoryModel.findOne.mockReturnValue(execResolves(existing));

      const result = await service.syncAll();

      expect(result).toEqual({ processed: 1, added: 0, updated: 1, failed: 0 });
      expect(existing.name).toBe('Hành Động (Ophim đổi tên)');
      expect(existing.sourceUpdatedAt).toBeInstanceOf(Date);
      // Các field admin-curated phải giữ nguyên tuyệt đối:
      expect(existing.slug).toBe('ten-cu-slug');
      expect(existing.description).toBe('Ghi chú admin tự viết');
      expect(existing.isActive).toBe(false);
      expect(existing.isHot).toBe(true);
      expect(existing.save).toHaveBeenCalled();
    });

    it('khi Ophim không phản hồi được (lỗi mạng): cả lượt chạy FAILED, không tạo/sửa danh mục nào', async () => {
      httpService.get.mockReturnValue(throwError(() => new Error('network down')));

      const result = await service.syncAll();

      expect(result).toEqual({ processed: 0, added: 0, updated: 0, failed: 0 });
      expect(categoryModel.create).not.toHaveBeenCalled();
      expect(crawlerHistoryService.record).toHaveBeenCalledWith(
        expect.objectContaining({ status: CrawlerRunStatus.FAILED, errorMessage: 'network down' }),
      );
    });
  });

  describe('syncOne', () => {
    it('ném NotFoundException khi không tìm thấy danh mục cục bộ theo slug', async () => {
      categoryModel.findOne.mockReturnValue(execResolves(null));

      await expect(service.syncOne('khong-ton-tai')).rejects.toThrow(NotFoundException);
    });

    it('không làm gì (success:false) khi danh mục cục bộ không có sourceSlug để khớp', async () => {
      categoryModel.findOne.mockReturnValue(
        execResolves({ slug: 'tu-tao', sourceSlug: null, save: jest.fn() }),
      );
      httpService.get.mockReturnValue(of({ status: 200, data: [] }));

      const result = await service.syncOne('tu-tao');

      expect(result).toEqual({ success: false, isNew: false });
    });
  });
});
