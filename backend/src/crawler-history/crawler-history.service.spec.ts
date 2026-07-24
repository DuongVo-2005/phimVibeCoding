import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { CrawlerRunStatus } from '../common/constants';
import { CrawlerHistoryService } from './crawler-history.service';
import { CrawlerRunRecord } from './interfaces/crawler-run-record.interface';
import { CrawlerHistory } from './schemas/crawler-history.schema';

describe('CrawlerHistoryService.record', () => {
  let service: CrawlerHistoryService;
  let crawlerHistoryModel: { create: jest.Mock };

  const buildRecord = (): CrawlerRunRecord => ({
    runId: 'run-1',
    source: 'ophim-films',
    startedAt: new Date(),
    finishedAt: new Date(),
    durationMs: 1000,
    status: CrawlerRunStatus.SUCCESS,
    added: 1,
    updated: 0,
    failed: 0,
    errorMessage: null,
    cronExpression: '0 * * * *',
  });

  beforeEach(async () => {
    crawlerHistoryModel = { create: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CrawlerHistoryService,
        { provide: getModelToken(CrawlerHistory.name), useValue: crawlerHistoryModel },
      ],
    }).compile();

    service = module.get(CrawlerHistoryService);
  });

  it('success: ghi lại đúng entry qua model.create()', async () => {
    crawlerHistoryModel.create.mockResolvedValue({ _id: 'history-1' });
    const entry = buildRecord();

    await service.record(entry);

    expect(crawlerHistoryModel.create).toHaveBeenCalledWith(entry);
  });

  it('database error: model.create() ném lỗi -> record() KHÔNG throw ra ngoài (nuốt lỗi, chỉ log)', async () => {
    crawlerHistoryModel.create.mockRejectedValue(new Error('Mongo connection lost'));
    const entry = buildRecord();

    await expect(service.record(entry)).resolves.toBeUndefined();
  });

  it('không throw exception: gọi record() nhiều lần liên tiếp khi DB luôn lỗi vẫn không làm crash tiến trình gọi', async () => {
    crawlerHistoryModel.create.mockRejectedValue(new Error('Mongo connection lost'));

    await expect(service.record(buildRecord())).resolves.toBeUndefined();
    await expect(service.record(buildRecord())).resolves.toBeUndefined();
    expect(crawlerHistoryModel.create).toHaveBeenCalledTimes(2);
  });
});
