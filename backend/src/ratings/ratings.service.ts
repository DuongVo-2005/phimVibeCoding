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

  async upsertRating(userId: string, filmId: string, dto: CreateRatingDto): Promise<RatingDocument> {
    const rating = await this.ratingModel
      .findOneAndUpdate(
        { film: filmId, user: userId },
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
    return this.ratingModel.findOne({ film: filmId, user: userId }).exec();
  }

  async removeRating(userId: string, filmId: string): Promise<void> {
    await this.ratingModel.deleteOne({ film: filmId, user: userId }).exec();
    await this.recalculateFilmRating(filmId);
  }
}
