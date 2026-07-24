import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { FavoriteTargetType } from '../common/constants';
import { PaginatedResponseDto } from '../common/dto/paginated-response.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { Actor, ActorDocument } from '../actors/schemas/actor.schema';
import { Film, FilmDocument } from '../films/schemas/film.schema';
import { CreateFavoriteDto } from './dto/create-favorite.dto';
import { Favorite, FavoriteDocument } from './schemas/favorite.schema';

export interface ResolvedFavorite {
  _id: unknown;
  targetType: FavoriteTargetType;
  target: FilmDocument | ActorDocument | null;
  createdAt: Date;
}

@Injectable()
export class FavoritesService {
  constructor(
    @InjectModel(Favorite.name) private readonly favoriteModel: Model<FavoriteDocument>,
    @InjectModel(Film.name) private readonly filmModel: Model<FilmDocument>,
    @InjectModel(Actor.name) private readonly actorModel: Model<ActorDocument>,
  ) {}

  async add(userId: string, dto: CreateFavoriteDto): Promise<FavoriteDocument> {
    const existing = await this.favoriteModel
      .findOne({ user: userId, targetType: dto.targetType, target: dto.target })
      .exec();

    if (existing) {
      return existing;
    }

    return this.favoriteModel.create({
      user: userId,
      targetType: dto.targetType,
      target: dto.target,
    });
  }

  async remove(userId: string, targetType: FavoriteTargetType, targetId: string): Promise<void> {
    const result = await this.favoriteModel
      .findOneAndDelete({ user: userId, targetType, target: targetId })
      .exec();

    if (!result) {
      throw new NotFoundException('Không tìm thấy mục yêu thích');
    }
  }

  async findMine(
    userId: string,
    targetType: FavoriteTargetType,
    query: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<ResolvedFavorite>> {
    const filter = { user: userId, targetType };

    const [favorites, totalItems] = await Promise.all([
      this.favoriteModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(query.skip)
        .limit(query.limit)
        .exec(),
      this.favoriteModel.countDocuments(filter).exec(),
    ]);

    const targetIds = favorites.map((favorite) => favorite.target);

    let targetMap = new Map<string, FilmDocument | ActorDocument>();

    if (targetType === FavoriteTargetType.FILM) {
      const films = await this.filmModel.find({ _id: { $in: targetIds } }).exec();
      targetMap = new Map(films.map((film) => [film._id.toString(), film]));
    } else if (targetType === FavoriteTargetType.ACTOR) {
      const actors = await this.actorModel.find({ _id: { $in: targetIds } }).exec();
      targetMap = new Map(actors.map((actor) => [actor._id.toString(), actor]));
    }

    const items: ResolvedFavorite[] = favorites.map((favorite) => ({
      _id: favorite._id,
      targetType: favorite.targetType,
      target: targetMap.get(favorite.target.toString()) ?? null,
      createdAt: favorite.createdAt as Date,
    }));

    return new PaginatedResponseDto(items, totalItems, query.page, query.limit);
  }
}
