import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { FilmsService } from '../films/films.service';
import { CreateRatingDto } from './dto/create-rating.dto';
import { Rating, RatingDocument } from './schemas/rating.schema';

@Injectable()
export class RatingsService {
  constructor(
    @InjectModel(Rating.name) private readonly ratingModel: Model<RatingDocument>,
    private readonly filmsService: FilmsService,
  ) {}

  private async recalculateFilmRating(filmId: string): Promise<{ average: number; count: number }> {
    const [result] = await this.ratingModel.aggregate([
      { $match: { film: new Types.ObjectId(filmId) } },
      { $group: { _id: '$film', avg: { $avg: '$score' }, count: { $sum: 1 } } },
    ]);

    const average = result?.avg ?? 0;
    const count = result?.count ?? 0;

    await this.filmsService.recalculateRating(filmId, average, count);

    return { average, count };
  }

  // Ép kiểu tường minh sang ObjectId ở CẢ BA method bên dưới (upsertRating/getMyRating/
  // removeRating) — đây là một bản sửa thống nhất cho cùng 1 bug, không phải 3 thay đổi độc lập:
  // filter truyền chuỗi thô không được Mongoose tự cast sang ObjectId trong môi trường này (đã xác
  // minh thực nghiệm với cả findOneAndUpdate({upsert:true}) lẫn findOne()/deleteOne()), nên field
  // `film`/`user` từng bị lưu thành String thay vì ObjectId. Nếu chỉ sửa upsertRating (ghi) mà
  // không sửa getMyRating/removeRating (đọc/xoá) theo cùng cách, dữ liệu ghi đúng (ObjectId) sẽ
  // không còn khớp với filter đọc/xoá bằng chuỗi thô nữa — gây regression mới thay vì sửa bug cũ.

  async upsertRating(userId: string, filmId: string, dto: CreateRatingDto): Promise<RatingDocument> {
    const rating = await this.ratingModel
      .findOneAndUpdate(
        { film: new Types.ObjectId(filmId), user: new Types.ObjectId(userId) },
        { score: dto.score },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      )
      .exec();

    await this.recalculateFilmRating(filmId);

    return rating;
  }

  async getFilmRatingSummary(filmId: string): Promise<{ average: number; count: number }> {
    const [result] = await this.ratingModel.aggregate([
      { $match: { film: new Types.ObjectId(filmId) } },
      { $group: { _id: '$film', avg: { $avg: '$score' }, count: { $sum: 1 } } },
    ]);

    if (!result) {
      return { average: 0, count: 0 };
    }

    return { average: result.avg, count: result.count };
  }

  async getMyRating(userId: string, filmId: string): Promise<RatingDocument | null> {
    return this.ratingModel
      .findOne({ film: new Types.ObjectId(filmId), user: new Types.ObjectId(userId) })
      .exec();
  }

  async removeRating(userId: string, filmId: string): Promise<void> {
    await this.ratingModel
      .deleteOne({ film: new Types.ObjectId(filmId), user: new Types.ObjectId(userId) })
      .exec();
    await this.recalculateFilmRating(filmId);
  }
}
