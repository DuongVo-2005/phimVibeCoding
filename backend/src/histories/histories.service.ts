import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PaginatedResponseDto } from '../common/dto/paginated-response.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { UpdateHistoryDto } from './dto/update-history.dto';
import { History, HistoryDocument } from './schemas/history.schema';

@Injectable()
export class HistoriesService {
  constructor(
    @InjectModel(History.name) private readonly historyModel: Model<HistoryDocument>,
  ) {}

  async upsertProgress(userId: string, dto: UpdateHistoryDto): Promise<HistoryDocument> {
    const { film, ...rest } = dto;
    return this.historyModel
      .findOneAndUpdate(
        { user: userId, film },
        { $set: { ...rest, lastWatchedAt: new Date() } },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      )
      .exec();
  }

  async findRecent(
    userId: string,
    query: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<HistoryDocument>> {
    const filter = { user: userId };

    const [items, totalItems] = await Promise.all([
      this.historyModel
        .find(filter)
        .populate('film', 'title slug posterUrl thumbUrl episodeCurrent category isPublished')
        .sort({ lastWatchedAt: -1 })
        .skip(query.skip)
        .limit(query.limit)
        .exec(),
      this.historyModel.countDocuments(filter).exec(),
    ]);

    return new PaginatedResponseDto(items, totalItems, query.page, query.limit);
  }

  findByFilm(userId: string, filmId: string): Promise<HistoryDocument | null> {
    return this.historyModel.findOne({ user: userId, film: filmId }).exec();
  }

  async remove(userId: string, filmId: string): Promise<void> {
    const result = await this.historyModel
      .findOneAndDelete({ user: userId, film: filmId })
      .exec();
    if (!result) {
      throw new NotFoundException('Không tìm thấy lịch sử xem');
    }
  }
}
