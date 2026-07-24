import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { Test, TestingModule } from '@nestjs/testing';
import { CrawlerRunStatus } from '../common/constants';
import { CrawlerHistoryService } from '../crawler-history/crawler-history.service';
import { CrawlerSchedulerService } from './crawler-scheduler.service';
import { CrawlerService } from './crawler.service';

describe('CrawlerSchedulerService.resolveStatus', () => {
  let service: CrawlerSchedulerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CrawlerSchedulerService,
        { provide: ConfigService, useValue: { get: jest.fn().mockReturnValue({ enabled: false }) } },
        { provide: SchedulerRegistry, useValue: { addCronJob: jest.fn() } },
        { provide: CrawlerService, useValue: {} },
        { provide: CrawlerHistoryService, useValue: { record: jest.fn() } },
      ],
    }).compile();

    service = module.get(CrawlerSchedulerService);
  });

  // resolveStatus là private — truy cập qua type cast, không đổi production code.
  const resolveStatus = (
    counts: { added: number; updated: number; failed: number },
    errorMessage: string | null,
  ): CrawlerRunStatus => (service as any).resolveStatus(counts, errorMessage);

  it('SUCCESS: không có lỗi, failed=0', () => {
    expect(resolveStatus({ added: 5, updated: 2, failed: 0 }, null)).toBe(CrawlerRunStatus.SUCCESS);
  });

  it('SUCCESS: không có lỗi, mọi count đều 0 (không có gì để xử lý)', () => {
    expect(resolveStatus({ added: 0, updated: 0, failed: 0 }, null)).toBe(CrawlerRunStatus.SUCCESS);
  });

  it('FAILED: có errorMessage (source.run() ném exception) -> FAILED bất kể counts', () => {
    expect(resolveStatus({ added: 10, updated: 5, failed: 0 }, 'network timeout')).toBe(
      CrawlerRunStatus.FAILED,
    );
  });

  it('FAILED: không có exception nhưng failed > 0 và added+updated = 0 (toàn bộ thất bại)', () => {
    expect(resolveStatus({ added: 0, updated: 0, failed: 8 }, null)).toBe(CrawlerRunStatus.FAILED);
  });

  it('PARTIAL_SUCCESS: có failed > 0 nhưng vẫn có added/updated > 0', () => {
    expect(resolveStatus({ added: 3, updated: 0, failed: 2 }, null)).toBe(
      CrawlerRunStatus.PARTIAL_SUCCESS,
    );
  });

  it('PARTIAL_SUCCESS: failed > 0, chỉ updated > 0 (không có added)', () => {
    expect(resolveStatus({ added: 0, updated: 1, failed: 1 }, null)).toBe(
      CrawlerRunStatus.PARTIAL_SUCCESS,
    );
  });

  it('edge case: errorMessage là chuỗi rỗng ("") -> coi như KHÔNG có lỗi (falsy), rơi xuống nhánh counts', () => {
    // errorMessage chỉ được set khi catch (error instanceof Error ? error.message : String(error))
    // nên thực tế khó xảy ra rỗng, nhưng test để ghi lại đúng hành vi hiện tại của `if (errorMessage)`.
    expect(resolveStatus({ added: 1, updated: 0, failed: 0 }, '')).toBe(CrawlerRunStatus.SUCCESS);
  });

  it('edge case: errorMessage rỗng + failed > 0 + added/updated = 0 -> FAILED (qua nhánh counts, không qua nhánh error)', () => {
    expect(resolveStatus({ added: 0, updated: 0, failed: 3 }, '')).toBe(CrawlerRunStatus.FAILED);
  });
});
