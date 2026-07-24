import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { PaginatedResponseDto } from '../common/dto/paginated-response.dto';
import { QueryCrawlerHistoryDto } from './dto/query-crawler-history.dto';
import { CrawlerRunRecord } from './interfaces/crawler-run-record.interface';
import { CrawlerHistory, CrawlerHistoryDocument } from './schemas/crawler-history.schema';

@Injectable()
export class CrawlerHistoryService {
  private readonly logger = new Logger(CrawlerHistoryService.name);

  constructor(
    @InjectModel(CrawlerHistory.name)
    private readonly crawlerHistoryModel: Model<CrawlerHistoryDocument>,
  ) {}

  /**
   * Ghi lại 1 lần chạy crawler. Không throw ra ngoài — một lỗi khi ghi log
   * không được phép làm gián đoạn tiến trình crawler đang chạy.
   */
  async record(entry: CrawlerRunRecord): Promise<void> {
    try {
      await this.crawlerHistoryModel.create(entry);
    } catch (error) {
      this.logger.error(
        `Không thể ghi lịch sử crawl (source=${entry.source}, runId=${entry.runId}): ${error}`,
      );
    }
  }

  async findAll(query: QueryCrawlerHistoryDto): Promise<PaginatedResponseDto<CrawlerHistoryDocument>> {
    const filter: FilterQuery<CrawlerHistoryDocument> = {};

    if (query.source) {
      filter.source = query.source;
    }
    if (query.status) {
      filter.status = query.status;
    }
    if (query.from || query.to) {
      filter.startedAt = {};
      if (query.from) {
        filter.startedAt.$gte = new Date(query.from);
      }
      if (query.to) {
        filter.startedAt.$lte = new Date(query.to);
      }
    }

    const [items, totalItems] = await Promise.all([
      this.crawlerHistoryModel
        .find(filter)
        .sort({ startedAt: -1 })
        .skip(query.skip)
        .limit(query.limit)
        .exec(),
      this.crawlerHistoryModel.countDocuments(filter).exec(),
    ]);

    return new PaginatedResponseDto(items, totalItems, query.page, query.limit);
  }

  async findOne(id: string): Promise<CrawlerHistoryDocument> {
    const record = await this.crawlerHistoryModel.findById(id).exec();
    if (!record) {
      throw new NotFoundException('Không tìm thấy lịch sử crawl');
    }
    return record;
  }
}
