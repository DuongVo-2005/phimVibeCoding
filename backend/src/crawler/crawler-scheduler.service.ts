import { randomUUID } from 'crypto';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { CrawlerRunStatus } from '../common/constants';
import { OphimConfig } from '../config/configuration';
import { CrawlerHistoryService } from '../crawler-history/crawler-history.service';
import { CrawlerRunRecord } from '../crawler-history/interfaces/crawler-run-record.interface';
import { CrawlerService, SyncResult } from './crawler.service';

interface CrawlerRunCounts {
  added: number;
  updated: number;
  failed: number;
}

interface CrawlerSource {
  /** Định danh duy nhất, dùng làm tên CronJob đăng ký với SchedulerRegistry. */
  name: string;
  /** Biểu thức cron lấy từ biến môi trường (qua ConfigService). */
  schedule: string;
  run: () => Promise<unknown>;
  /** Trích xuất số liệu added/updated/failed từ kết quả trả về của `run()`, dùng để ghi lịch sử. */
  summarize?: (result: unknown) => CrawlerRunCounts;
}

const ZERO_COUNTS: CrawlerRunCounts = { added: 0, updated: 0, failed: 0 };

/**
 * Tự động kích hoạt các nguồn crawler theo lịch cron, thay cho việc admin phải gọi
 * API thủ công. Mỗi nguồn được đăng ký động (SchedulerRegistry) thay vì dùng decorator
 * @Cron tĩnh, vì decorator đọc process.env tại thời điểm import module — trước khi
 * ConfigModule nạp xong file .env — nên không phản ánh đúng giá trị cấu hình.
 *
 * Mỗi lần chạy đều được ghi vào CrawlerHistory (CrawlerHistoryService), kể cả khi lỗi.
 *
 * Thêm nguồn crawler mới: bổ sung một phần tử vào mảng `sources` bên dưới (kèm hàm
 * `summarize` nếu muốn số liệu added/updated/failed xuất hiện trong lịch sử).
 */
@Injectable()
export class CrawlerSchedulerService implements OnModuleInit {
  private readonly logger = new Logger(CrawlerSchedulerService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly crawlerService: CrawlerService,
    private readonly crawlerHistoryService: CrawlerHistoryService,
  ) {}

  onModuleInit() {
    const ophimConfig = this.configService.get<OphimConfig>('ophim')!;

    if (!ophimConfig.enabled) {
      this.logger.log('Crawler tự động đang tắt (OPHIM_CRAWLER_ENABLED=false)');
      return;
    }

    const sources: CrawlerSource[] = [
      {
        name: 'ophim-films',
        schedule: ophimConfig.syncListCron,
        run: () => this.crawlerService.syncFilmList(),
        summarize: (result) => {
          const { added, updated, failed } = result as SyncResult;
          return { added, updated, failed };
        },
      },
      {
        name: 'ophim-types',
        schedule: ophimConfig.syncTypesCron,
        run: () => this.crawlerService.syncTypes(),
      },
    ];

    sources.forEach((source) => this.registerJob(source));
  }

  private registerJob(source: CrawlerSource): void {
    const jobName = `crawler:${source.name}`;
    const job = new CronJob(source.schedule, () => this.runSource(source));

    this.schedulerRegistry.addCronJob(jobName, job);
    job.start();

    this.logger.log(`Đã đăng ký lịch tự động cho nguồn '${source.name}': ${source.schedule}`);
  }

  /** Chạy 1 nguồn crawler, cô lập lỗi để không ảnh hưởng tới các nguồn khác, và ghi lại lịch sử. */
  private async runSource(source: CrawlerSource): Promise<void> {
    const runId = randomUUID();
    const startedAt = new Date();
    this.logger.log(`[${source.name}] (runId=${runId}) Bắt đầu đồng bộ tự động`);

    let counts: CrawlerRunCounts = ZERO_COUNTS;
    let errorMessage: string | null = null;

    try {
      const result = await source.run();
      counts = source.summarize ? source.summarize(result) : ZERO_COUNTS;
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `[${source.name}] (runId=${runId}) Lỗi: ${error instanceof Error ? error.stack : error}`,
      );
    }

    const status = this.resolveStatus(counts, errorMessage);
    const finishedAt = new Date();
    const durationMs = finishedAt.getTime() - startedAt.getTime();

    this.logger.log(
      `[${source.name}] (runId=${runId}) Kết thúc sau ${durationMs}ms — status=${status}, ` +
        `added=${counts.added}, updated=${counts.updated}, failed=${counts.failed}`,
    );

    const record: CrawlerRunRecord = {
      runId,
      source: source.name,
      startedAt,
      finishedAt,
      durationMs,
      status,
      added: counts.added,
      updated: counts.updated,
      failed: counts.failed,
      errorMessage,
      cronExpression: source.schedule,
    };

    await this.crawlerHistoryService.record(record);
  }

  private resolveStatus(counts: CrawlerRunCounts, errorMessage: string | null): CrawlerRunStatus {
    if (errorMessage) {
      return CrawlerRunStatus.FAILED;
    }
    if (counts.failed === 0) {
      return CrawlerRunStatus.SUCCESS;
    }
    return counts.added + counts.updated === 0 ? CrawlerRunStatus.FAILED : CrawlerRunStatus.PARTIAL_SUCCESS;
  }
}
