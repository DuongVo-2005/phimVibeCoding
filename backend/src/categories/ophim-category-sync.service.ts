import { randomUUID } from 'crypto';
import { HttpService } from '@nestjs/axios';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { AxiosError } from 'axios';
import { Model } from 'mongoose';
import { firstValueFrom } from 'rxjs';
import { CrawlerRunStatus } from '../common/constants';
import { OphimConfig } from '../config/configuration';
import { CrawlerHistoryService } from '../crawler-history/crawler-history.service';
import { CrawlerRunRecord } from '../crawler-history/interfaces/crawler-run-record.interface';
import { toSlug } from '../common/utils/slugify.util';
import { Category, CategoryDocument } from './schemas/category.schema';

export interface CategorySyncResult {
  processed: number;
  added: number;
  updated: number;
  failed: number;
}

interface OphimCategoryItem {
  name: string;
  slug: string;
}

const SOURCE = 'ophim-categories';

/**
 * Đồng bộ danh mục (thể loại) từ Ophim (`GET /the-loai`). Ophim không có endpoint chi tiết theo
 * từng danh mục — nguồn duy nhất luôn là danh sách đầy đủ này.
 */
@Injectable()
export class OphimCategorySyncService {
  private readonly logger = new Logger(OphimCategorySyncService.name);
  private readonly baseUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    @InjectModel(Category.name) private readonly categoryModel: Model<CategoryDocument>,
    private readonly crawlerHistoryService: CrawlerHistoryService,
  ) {
    this.baseUrl = this.configService.get<OphimConfig>('ophim')!.baseUrl;
  }

  async syncAll(): Promise<CategorySyncResult> {
    const runId = randomUUID();
    const startedAt = new Date();

    let added = 0;
    let updated = 0;
    let failed = 0;
    let errorMessage: string | null = null;

    try {
      const items = await this.fetchOphimCategories();
      for (const item of items) {
        try {
          const isNew = await this.upsertFromOphim(item);
          isNew ? added++ : updated++;
        } catch (error) {
          failed++;
          this.logger.error(`[syncAll] Lỗi khi upsert danh mục slug=${item.slug}: ${error}`);
        }
      }
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : String(error);
    }

    await this.recordRun(runId, startedAt, added, updated, failed, errorMessage);

    return { processed: added + updated + failed, added, updated, failed };
  }

  /** :slug là slug NỘI BỘ của ta, không phải slug bên Ophim — xem business rule ở api_design.md §8.3. */
  async syncOne(slug: string): Promise<{ success: boolean; isNew: boolean }> {
    const runId = randomUUID();
    const startedAt = new Date();

    const local = await this.categoryModel.findOne({ slug }).exec();
    if (!local) {
      throw new NotFoundException('Không tìm thấy danh mục để đồng bộ');
    }

    let added = 0;
    let updated = 0;
    let failed = 0;
    let errorMessage: string | null = null;
    let success = false;

    try {
      const items = await this.fetchOphimCategories();
      const upstreamMatch = local.sourceSlug
        ? items.find((item) => item.slug === local.sourceSlug)
        : undefined;

      if (upstreamMatch) {
        local.name = upstreamMatch.name;
        local.sourceUpdatedAt = new Date();
        await local.save();
        updated = 1;
        success = true;
      }
      // Không có sourceSlug hoặc không còn khớp bên Ophim -> không có gì để đồng bộ (không phải lỗi).
    } catch (error) {
      failed = 1;
      errorMessage = error instanceof Error ? error.message : String(error);
    }

    await this.recordRun(runId, startedAt, added, updated, failed, errorMessage);

    return { success, isNew: false };
  }

  private async upsertFromOphim(item: OphimCategoryItem): Promise<boolean> {
    const existing = await this.categoryModel.findOne({ sourceSlug: item.slug }).exec();
    if (existing) {
      existing.name = item.name;
      existing.sourceUpdatedAt = new Date();
      await existing.save();
      return false;
    }

    await this.categoryModel.create({
      name: item.name,
      slug: toSlug(item.name),
      source: 'ophim',
      sourceSlug: item.slug,
      sourceUpdatedAt: new Date(),
      isActive: true,
    });
    return true;
  }

  private async fetchOphimCategories(): Promise<OphimCategoryItem[]> {
    const url = `${this.baseUrl}/the-loai`;

    try {
      const response = await firstValueFrom(this.httpService.get<OphimCategoryItem[]>(url));
      this.logger.log(`[fetchOphimCategories] GET ${url} — status=${response.status}`);
      return response.data ?? [];
    } catch (error) {
      this.logRequestError('fetchOphimCategories', url, error);
      throw error;
    }
  }

  private async recordRun(
    runId: string,
    startedAt: Date,
    added: number,
    updated: number,
    failed: number,
    errorMessage: string | null,
  ): Promise<void> {
    const finishedAt = new Date();
    const record: CrawlerRunRecord = {
      runId,
      source: SOURCE,
      startedAt,
      finishedAt,
      durationMs: finishedAt.getTime() - startedAt.getTime(),
      status: this.resolveStatus(added, updated, failed, errorMessage),
      added,
      updated,
      failed,
      errorMessage,
      cronExpression: 'manual',
    };
    await this.crawlerHistoryService.record(record);
  }

  private resolveStatus(
    added: number,
    updated: number,
    failed: number,
    errorMessage: string | null,
  ): CrawlerRunStatus {
    if (errorMessage) {
      return CrawlerRunStatus.FAILED;
    }
    if (failed === 0) {
      return CrawlerRunStatus.SUCCESS;
    }
    return added + updated === 0 ? CrawlerRunStatus.FAILED : CrawlerRunStatus.PARTIAL_SUCCESS;
  }

  /** Log đầy đủ URL, HTTP status, response body khi lỗi — cùng convention với OphimClientService. */
  private logRequestError(context: string, url: string, error: unknown) {
    const axiosError = error as AxiosError;
    const status = axiosError.response?.status;
    const body = axiosError.response?.data;

    if (status !== undefined) {
      this.logger.error(`[${context}] GET ${url} — status=${status}, body=${this.safeStringify(body)}`);
    } else {
      this.logger.error(`[${context}] GET ${url} — network error: ${axiosError?.message ?? error}`);
    }
  }

  private safeStringify(body: unknown): string {
    try {
      return JSON.stringify(body);
    } catch {
      return String(body);
    }
  }
}
