import { CrawlerRunStatus } from '../../common/constants';

/** Dữ liệu 1 lần chạy crawler, dùng để ghi vào CrawlerHistory. */
export interface CrawlerRunRecord {
  runId: string;
  source: string;
  startedAt: Date;
  finishedAt: Date;
  durationMs: number;
  status: CrawlerRunStatus;
  added: number;
  updated: number;
  failed: number;
  errorMessage?: string | null;
  cronExpression: string;
}
