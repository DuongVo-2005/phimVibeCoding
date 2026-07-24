import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import pLimit from 'p-limit';
import { CategoriesService } from '../categories/categories.service';
import { OphimConfig } from '../config/configuration';
import { FilmsService } from '../films/films.service';
import { OphimClientService } from './ophim-client.service';
import { OphimMapperService } from './ophim-mapper.service';

export interface SyncResult {
  processed: number;
  succeeded: number;
  failed: number;
  added: number;
  updated: number;
}

@Injectable()
export class CrawlerService {
  private readonly logger = new Logger(CrawlerService.name);
  private readonly ophimConfig: OphimConfig;
  private isSyncingList = false;
  /** Chỉ log chi tiết đầy đủ cho phim lỗi ĐẦU TIÊN trong mỗi lượt sync-film-list, tránh spam log. */
  private firstFailureLogged = false;

  constructor(
    private readonly configService: ConfigService,
    private readonly ophimClient: OphimClientService,
    private readonly ophimMapper: OphimMapperService,
    private readonly filmsService: FilmsService,
    private readonly categoriesService: CategoriesService,
  ) {
    this.ophimConfig = this.configService.get<OphimConfig>('ophim')!;
  }

  /**
   * Job "sync-film-list": lấy danh sách phim mới cập nhật từ ophim.cc theo trang,
   * sau đó enqueue (xử lý tuần tự, giới hạn concurrency) job "sync-film-detail" cho từng slug.
   * Được gọi thủ công qua CrawlerController hoặc tự động qua CrawlerSchedulerService.
   */
  async syncFilmList(maxPages = this.ophimConfig.syncListMaxPages): Promise<SyncResult> {
    if (this.isSyncingList) {
      this.logger.warn('Bỏ qua: một tiến trình sync-film-list khác đang chạy');
      return { processed: 0, succeeded: 0, failed: 0, added: 0, updated: 0 };
    }

    this.isSyncingList = true;
    this.firstFailureLogged = false;
    const limit = pLimit(this.ophimConfig.requestConcurrency);
    const slugs = new Set<string>();

    try {
      for (let page = 1; page <= maxPages; page++) {
        const list = await this.ophimClient.getUpdatedList(page);
        const items = list?.items ?? list?.data?.items ?? [];
        if (items.length === 0) {
          break;
        }
        items.forEach((item) => slugs.add(item.slug));
      }

      this.logger.log(`sync-film-list: tìm thấy ${slugs.size} phim cần đồng bộ chi tiết`);

      const startedAt = Date.now();
      let succeeded = 0;
      let failed = 0;
      let added = 0;
      let updated = 0;

      await Promise.all(
        Array.from(slugs).map((slug) =>
          limit(async () => {
            const result = await this.syncFilmDetail(slug);
            if (result.success) {
              succeeded++;
              result.isNew ? added++ : updated++;
            } else {
              failed++;
            }
          }),
        ),
      );

      const summary = { processed: slugs.size, succeeded, failed, added, updated };
      this.logger.log(
        `sync-film-list: hoàn tất — processed=${summary.processed}, added=${summary.added}, updated=${summary.updated}, failed=${summary.failed}`,
      );
      this.logger.log(
        `Processed: ${summary.processed}\n` +
          `Succeeded: ${summary.succeeded}\n` +
          `Added: ${summary.added}\n` +
          `Updated: ${summary.updated}\n` +
          `Failed: ${summary.failed}\n` +
          `Duration: ${Date.now() - startedAt} ms`,
      );

      return summary;
    } finally {
      this.isSyncingList = false;
    }
  }

  /** Job "sync-film-detail": lấy chi tiết 1 phim theo slug và upsert vào MongoDB. */
  async syncFilmDetail(slug: string): Promise<{ success: boolean; isNew: boolean }> {
    const detailUrl = `${this.ophimConfig.baseUrl}/phim/${slug}`;

    this.logger.log(`Syncing details for movie: ${slug}`);

    const detail = await this.ophimClient.getMovieDetail(slug);
    if (!detail?.movie || Array.isArray(detail.movie)) {
      this.logger.warn(`sync-film-detail: không lấy được dữ liệu cho slug=${slug}`);
      this.logFirstFailure({ slug, url: detailUrl, stage: 'fetch detail', response: detail });
      this.logger.error(`Failed movie: ${slug}\nStage: fetch\nError: không lấy được dữ liệu chi tiết`);
      return { success: false, isNew: false };
    }

    this.logger.log(`Detail fetched: ${slug}`);

    let filmData: Awaited<ReturnType<OphimMapperService['mapToFilmData']>>;
    try {
      this.logger.log(`Mapping movie: ${slug}`);
      filmData = await this.ophimMapper.mapToFilmData(detail);
    } catch (error) {
      this.logger.error(`sync-film-detail: lỗi khi map DTO slug=${slug}: ${error}`);
      this.logFirstFailure({ slug, url: detailUrl, stage: 'map DTO', response: detail, error });
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed movie: ${slug}\nStage: mapping\nError: ${message}`);
      return { success: false, isNew: false };
    }

    try {
      const { isNew } = await this.filmsService.upsertBySlug(filmData.slug as string, filmData);
      this.logger.log(`Saved movie: ${slug}`);
      return { success: true, isNew };
    } catch (error) {
      this.logger.error(`sync-film-detail: lỗi khi upsert slug=${slug}: ${error}`);
      this.logFirstFailure({ slug, url: detailUrl, stage: 'save Mongo', response: filmData, error });
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed movie: ${slug}\nStage: save\nError: ${message}`);
      return { success: false, isNew: false };
    }
  }

  /**
   * Log toàn bộ chi tiết (slug, URL, response, vị trí lỗi, error.message, error.stack) cho phim
   * lỗi ĐẦU TIÊN trong lượt sync-film-list hiện tại, để xác định chính xác nguyên nhân thay vì
   * chỉ đếm failed++.
   */
  private logFirstFailure(params: {
    slug: string;
    url: string;
    stage: 'fetch detail' | 'map DTO' | 'save Mongo';
    response: unknown;
    error?: unknown;
  }): void {
    if (this.firstFailureLogged) {
      return;
    }
    this.firstFailureLogged = true;

    const err = params.error as Error | undefined;
    this.logger.error(
      [
        '=== sync-film-list: chi tiết lỗi đầu tiên ===',
        `slug: ${params.slug}`,
        `url: ${params.url}`,
        `vị trí lỗi: ${params.stage}`,
        `response nhận được: ${this.safeStringify(params.response)}`,
        `error.message: ${err?.message ?? '(không có exception — response không hợp lệ hoặc rỗng)'}`,
        `error.stack: ${err?.stack ?? '(n/a)'}`,
      ].join('\n'),
    );
  }

  private safeStringify(value: unknown): string {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }

  /**
   * Job "sync-types": tên method/endpoint giữ nguyên để không phá vỡ API hiện có (POST
   * /crawler/sync/types), dù danh mục giờ được quản lý bởi CategoriesModule (đổi tên từ
   * TypesModule ở Phase 3 — xem CategoriesModule.OphimCategorySyncService cho việc đồng bộ
   * thật sự từ Ophim). Job này chỉ log số lượng danh mục hiện có để theo dõi.
   */
  async syncTypes(): Promise<{ totalTypes: number }> {
    const categories = await this.categoriesService.findAll({});
    this.logger.log(`sync-types: hiện có ${categories.length} danh mục trong hệ thống`);
    return { totalTypes: categories.length };
  }
}
