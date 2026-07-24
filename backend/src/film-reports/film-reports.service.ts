import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PaginatedResponseDto } from '../common/dto/paginated-response.dto';
import { CreateFilmReportDto } from './dto/create-film-report.dto';
import { QueryFilmReportDto } from './dto/query-film-report.dto';
import { UpdateFilmReportStatusDto } from './dto/update-film-report-status.dto';
import { FilmReport, FilmReportDocument } from './schemas/film-report.schema';

@Injectable()
export class FilmReportsService {
  constructor(
    @InjectModel(FilmReport.name) private readonly filmReportModel: Model<FilmReportDocument>,
  ) {}

  create(dto: CreateFilmReportDto): Promise<FilmReportDocument> {
    return this.filmReportModel.create({
      film: dto.film,
      reason: dto.reason,
      user: dto.userId ?? null,
    });
  }

  async findAll(query: QueryFilmReportDto): Promise<PaginatedResponseDto<FilmReportDocument>> {
    const filter = query.status ? { status: query.status } : {};

    const [items, totalItems] = await Promise.all([
      this.filmReportModel
        .find(filter)
        .populate('film', 'title slug')
        .sort({ createdAt: -1 })
        .skip(query.skip)
        .limit(query.limit)
        .exec(),
      this.filmReportModel.countDocuments(filter).exec(),
    ]);

    return new PaginatedResponseDto(items, totalItems, query.page, query.limit);
  }

  async updateStatus(
    id: string,
    dto: UpdateFilmReportStatusDto,
  ): Promise<FilmReportDocument> {
    const report = await this.filmReportModel
      .findByIdAndUpdate(id, { status: dto.status }, { new: true })
      .exec();
    if (!report) {
      throw new NotFoundException('Không tìm thấy báo cáo');
    }
    return report;
  }
}
