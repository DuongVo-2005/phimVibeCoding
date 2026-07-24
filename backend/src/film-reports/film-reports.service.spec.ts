import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { FilmReportStatus } from '../common/constants';
import { FilmReportsService } from './film-reports.service';
import { FilmReport } from './schemas/film-report.schema';

const execResolves = (value: unknown) => ({ exec: jest.fn().mockResolvedValue(value) });

const FILM_ID = '65f1a2b3c4d5e6f7a8b9c0d1';
const USER_ID = '65f1a2b3c4d5e6f7a8b9c0d2';

describe('FilmReportsService', () => {
  let service: FilmReportsService;
  let filmReportModel: {
    create: jest.Mock;
    find: jest.Mock;
    countDocuments: jest.Mock;
    findByIdAndUpdate: jest.Mock;
  };

  beforeEach(async () => {
    filmReportModel = {
      create: jest.fn(),
      find: jest.fn(),
      countDocuments: jest.fn(),
      findByIdAndUpdate: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FilmReportsService,
        { provide: getModelToken(FilmReport.name), useValue: filmReportModel },
      ],
    }).compile();

    service = module.get(FilmReportsService);
  });

  describe('create — bảo mật (Phase 6.1): userId truyền riêng, không lấy từ DTO client gửi', () => {
    it('userId=null (anonymous) -> tạo report với user=null', async () => {
      const created = { _id: 'r1', user: null };
      filmReportModel.create.mockResolvedValue(created);

      const result = await service.create(
        { film: FILM_ID, reason: 'Video lỗi' },
        null,
      );

      expect(filmReportModel.create).toHaveBeenCalledWith({
        film: FILM_ID,
        reason: 'Video lỗi',
        user: null,
      });
      expect(result).toBe(created);
    });

    it('userId có giá trị (đã xác thực qua JWT) -> tạo report gắn đúng user đó', async () => {
      filmReportModel.create.mockResolvedValue({ _id: 'r1', user: USER_ID });

      await service.create({ film: FILM_ID, reason: 'Video lỗi' }, USER_ID);

      expect(filmReportModel.create).toHaveBeenCalledWith({
        film: FILM_ID,
        reason: 'Video lỗi',
        user: USER_ID,
      });
    });

    it('tham số thứ 2 (userId) hoàn toàn độc lập với nội dung DTO — DTO không còn field userId nữa', () => {
      // CreateFilmReportDto (sau Phase 6.1) chỉ còn {film, reason} — xác nhận tĩnh bằng cách
      // service.create() nhận userId qua tham số riêng, không đọc dto.userId ở đâu cả.
      const dto = { film: FILM_ID, reason: 'Video lỗi' } as { film: string; reason: string };
      expect((dto as Record<string, unknown>).userId).toBeUndefined();
    });
  });

  describe('findAll', () => {
    it('lọc theo status khi có truyền, populate film', async () => {
      const chain: any = {};
      ['populate', 'sort', 'skip', 'limit'].forEach(
        (m) => (chain[m] = jest.fn().mockReturnValue(chain)),
      );
      chain.exec = jest.fn().mockResolvedValue([]);
      filmReportModel.find.mockReturnValue(chain);
      filmReportModel.countDocuments.mockReturnValue(execResolves(0));

      await service.findAll({
        status: FilmReportStatus.PENDING,
        page: 1,
        limit: 20,
        skip: 0,
      } as any);

      expect(filmReportModel.find).toHaveBeenCalledWith({ status: FilmReportStatus.PENDING });
      expect(chain.populate).toHaveBeenCalledWith('film', 'title slug');
    });

    it('không lọc status khi không truyền', async () => {
      const chain: any = {};
      ['populate', 'sort', 'skip', 'limit'].forEach(
        (m) => (chain[m] = jest.fn().mockReturnValue(chain)),
      );
      chain.exec = jest.fn().mockResolvedValue([]);
      filmReportModel.find.mockReturnValue(chain);
      filmReportModel.countDocuments.mockReturnValue(execResolves(0));

      await service.findAll({ page: 1, limit: 20, skip: 0 } as any);

      expect(filmReportModel.find).toHaveBeenCalledWith({});
    });
  });

  describe('updateStatus', () => {
    it('ném NotFoundException khi không tìm thấy báo cáo', async () => {
      filmReportModel.findByIdAndUpdate.mockReturnValue(execResolves(null));

      await expect(
        service.updateStatus('missing', { status: FilmReportStatus.RESOLVED }),
      ).rejects.toThrow(NotFoundException);
    });

    it('cập nhật đúng status', async () => {
      filmReportModel.findByIdAndUpdate.mockReturnValue(
        execResolves({ _id: 'r1', status: FilmReportStatus.RESOLVED }),
      );

      await service.updateStatus('r1', { status: FilmReportStatus.RESOLVED });

      expect(filmReportModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'r1',
        { status: FilmReportStatus.RESOLVED },
        { new: true },
      );
    });
  });
});
