import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Actor, ActorDocument } from '../actors/schemas/actor.schema';
import { Category, CategoryDocument } from '../categories/schemas/category.schema';
import { FavoriteTargetType } from '../common/constants';
import { Comment, CommentDocument } from '../comments/schemas/comment.schema';
import { Country, CountryDocument } from '../countries/schemas/country.schema';
import { Director, DirectorDocument } from '../directors/schemas/director.schema';
import { Favorite, FavoriteDocument } from '../favorites/schemas/favorite.schema';
import { FilmsService } from '../films/films.service';
import { Film, FilmDocument } from '../films/schemas/film.schema';
import { Playlist, PlaylistDocument } from '../playlists/schemas/playlist.schema';
import { Rating, RatingDocument } from '../ratings/schemas/rating.schema';
import { User, UserDocument } from '../users/schemas/user.schema';

export interface DashboardOverview {
  totalUsers: number;
  activeUsers: number;
  totalMovies: number;
  publishedMovies: number;
  draftMovies: number;
  categories: number;
  countries: number;
  actors: number;
  directors: number;
  comments: number;
  ratings: number;
  favorites: number;
  playlists: number;
  totalViews: number;
}

export interface MonthlyBucket {
  period: string;
  count: number;
}

export interface DashboardCharts {
  newUsers: MonthlyBucket[];
  moviesCreated: MonthlyBucket[];
  comments: MonthlyBucket[];
}

export interface FilmSummary {
  id: string;
  slug: string;
  title: string;
  posterUrl: string;
  view: number;
  ratingAvg: number;
  ratingCount: number;
}

export interface DashboardTopLists {
  mostViewedMovies: FilmSummary[];
  highestRatedMovies: FilmSummary[];
  mostFavoritedMovies: (FilmSummary & { favoriteCount: number })[];
}

export interface UserSummary {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

export interface CommentSummary {
  id: string;
  content: string;
  user: { id: string; name: string; email: string } | null;
  film: { id: string; slug: string; title: string } | null;
  createdAt: Date;
}

export interface DashboardRecentActivity {
  newUsers: UserSummary[];
  latestMovies: FilmSummary[];
  latestComments: CommentSummary[];
}

/** `$dateToString` gộp theo tháng UTC — nhất quán với `timestamps: true` của Mongoose (lưu UTC). */
const MONTH_GROUP_ID = { $dateToString: { format: '%Y-%m', date: '$createdAt' } };

function buildMonthSkeleton(months: number): string[] {
  const now = new Date();
  const periods: string[] = [];
  for (let i = months - 1; i >= 0; i -= 1) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    periods.push(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`);
  }
  return periods;
}

/** Aggregation `$group` chỉ trả về tháng CÓ dữ liệu — merge vào skeleton đủ N tháng liên tiếp để
 * tháng không có bản ghi nào vẫn hiện `count: 0` thay vì bị thiếu hẳn trên biểu đồ. */
function mergeMonthlyBuckets(
  skeleton: string[],
  results: { _id: string; count: number }[],
): MonthlyBucket[] {
  const counts = new Map(results.map((r) => [r._id, r.count]));
  return skeleton.map((period) => ({ period, count: counts.get(period) ?? 0 }));
}

function toFilmSummary(film: {
  _id: unknown;
  slug: string;
  title: string;
  posterUrl: string;
  view: number;
  ratingAvg: number;
  ratingCount: number;
}): FilmSummary {
  return {
    id: String(film._id),
    slug: film.slug,
    title: film.title,
    posterUrl: film.posterUrl,
    view: film.view,
    ratingAvg: film.ratingAvg,
    ratingCount: film.ratingCount,
  };
}

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Film.name) private readonly filmModel: Model<FilmDocument>,
    @InjectModel(Category.name) private readonly categoryModel: Model<CategoryDocument>,
    @InjectModel(Country.name) private readonly countryModel: Model<CountryDocument>,
    @InjectModel(Actor.name) private readonly actorModel: Model<ActorDocument>,
    @InjectModel(Director.name) private readonly directorModel: Model<DirectorDocument>,
    @InjectModel(Comment.name) private readonly commentModel: Model<CommentDocument>,
    @InjectModel(Rating.name) private readonly ratingModel: Model<RatingDocument>,
    @InjectModel(Favorite.name) private readonly favoriteModel: Model<FavoriteDocument>,
    @InjectModel(Playlist.name) private readonly playlistModel: Model<PlaylistDocument>,
    private readonly filmsService: FilmsService,
  ) {}

  /** 13 `countDocuments`/`aggregate` độc lập chạy song song qua `Promise.all` (không phải vòng lặp
   * N+1 — mỗi truy vấn đếm đúng 1 collection, không phụ thuộc kết quả truy vấn khác). */
  async getOverview(): Promise<DashboardOverview> {
    const [
      totalUsers,
      activeUsers,
      totalMovies,
      publishedMovies,
      categories,
      countries,
      actors,
      directors,
      comments,
      ratings,
      favorites,
      playlists,
      totalViewsResult,
    ] = await Promise.all([
      this.userModel.countDocuments({}).exec(),
      this.userModel.countDocuments({ isActive: true }).exec(),
      this.filmModel.countDocuments({}).exec(),
      this.filmModel.countDocuments({ isPublished: true }).exec(),
      this.categoryModel.countDocuments({}).exec(),
      this.countryModel.countDocuments({}).exec(),
      this.actorModel.countDocuments({}).exec(),
      this.directorModel.countDocuments({}).exec(),
      this.commentModel.countDocuments({}).exec(),
      this.ratingModel.countDocuments({}).exec(),
      this.favoriteModel.countDocuments({}).exec(),
      this.playlistModel.countDocuments({}).exec(),
      this.filmModel
        .aggregate<{ _id: null; total: number }>([
          { $group: { _id: null, total: { $sum: '$view' } } },
        ])
        .exec(),
    ]);

    return {
      totalUsers,
      activeUsers,
      totalMovies,
      publishedMovies,
      draftMovies: totalMovies - publishedMovies,
      categories,
      countries,
      actors,
      directors,
      comments,
      ratings,
      favorites,
      playlists,
      totalViews: totalViewsResult[0]?.total ?? 0,
    };
  }

  /** 3 pipeline `$match` + `$group` theo tháng (users/films/comments), chạy song song. */
  async getCharts(months: number): Promise<DashboardCharts> {
    const skeleton = buildMonthSkeleton(months);
    const since = new Date(
      Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth() - (months - 1), 1),
    );

    const monthlyPipeline = [
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: MONTH_GROUP_ID, count: { $sum: 1 } } },
    ];

    const [newUsersRaw, moviesCreatedRaw, commentsRaw] = await Promise.all([
      this.userModel.aggregate<{ _id: string; count: number }>(monthlyPipeline).exec(),
      this.filmModel.aggregate<{ _id: string; count: number }>(monthlyPipeline).exec(),
      this.commentModel.aggregate<{ _id: string; count: number }>(monthlyPipeline).exec(),
    ]);

    return {
      newUsers: mergeMonthlyBuckets(skeleton, newUsersRaw),
      moviesCreated: mergeMonthlyBuckets(skeleton, moviesCreatedRaw),
      comments: mergeMonthlyBuckets(skeleton, commentsRaw),
    };
  }

  /** "Xem nhiều nhất"/"Đánh giá cao nhất" tái dùng `FilmsService.findTop()` sẵn có (tránh trùng
   * lặp logic sort/filter `isPublished` đã viết ở Phase 4). "Yêu thích nhiều nhất" là aggregation
   * MỚI trên `favorites` (không có sẵn) — `$group` đếm theo phim rồi `$lookup` sang `films` một
   * lần duy nhất cho cả danh sách (không lặp query theo từng phim). Phim đã bị xoá khỏi `films`
   * bị `$lookup`+`$unwind` loại tự nhiên khỏi kết quả (không cần lọc tay orphan reference). */
  async getTopLists(limit: number): Promise<DashboardTopLists> {
    const [mostViewed, highestRated, mostFavoritedRaw] = await Promise.all([
      this.filmsService.findTop(limit, 'view'),
      this.filmsService.findTop(limit, 'ratingAvg'),
      this.favoriteModel
        .aggregate<{
          _id: unknown;
          favoriteCount: number;
          film: {
            _id: unknown;
            slug: string;
            title: string;
            posterUrl: string;
            view: number;
            ratingAvg: number;
            ratingCount: number;
          };
        }>([
          { $match: { targetType: FavoriteTargetType.FILM } },
          // `Favorite.target` không phải lúc nào cũng là ObjectId thật trong dữ liệu hiện có — cùng
          // lỗi cast Mongoose đã ghi nhận ở `ratings.service.ts` (`Model.create()` không luôn cast
          // đáng tin cậy chuỗi ObjectId). `$toObjectId` chuẩn hoá về ObjectId thật trước khi group,
          // nếu không `$lookup` bên dưới (so `_id` kiểu string với `films._id` kiểu ObjectId) sẽ
          // không khớp được bản ghi nào — đã xác nhận bug này qua QA thực tế trước khi sửa.
          { $group: { _id: { $toObjectId: '$target' }, favoriteCount: { $sum: 1 } } },
          { $sort: { favoriteCount: -1 } },
          { $limit: limit },
          {
            $lookup: {
              from: 'films',
              localField: '_id',
              foreignField: '_id',
              as: 'film',
              pipeline: [
                {
                  $project: {
                    slug: 1,
                    title: 1,
                    posterUrl: 1,
                    view: 1,
                    ratingAvg: 1,
                    ratingCount: 1,
                  },
                },
              ],
            },
          },
          { $unwind: '$film' },
        ])
        .exec(),
    ]);

    return {
      mostViewedMovies: mostViewed.map((film) => toFilmSummary(film)),
      highestRatedMovies: highestRated.map((film) => toFilmSummary(film)),
      mostFavoritedMovies: mostFavoritedRaw.map((entry) => ({
        ...toFilmSummary(entry.film),
        favoriteCount: entry.favoriteCount,
      })),
    };
  }

  /** `.populate()` trên kết quả mảng của Mongoose gộp thành 1 truy vấn `$in` theo từng field ref
   * (không phải N truy vấn riêng theo từng comment) — tổng cộng đúng 3 truy vấn (find + 2
   * populate) bất kể `limit` lớn nhỏ. */
  async getRecentActivity(limit: number): Promise<DashboardRecentActivity> {
    const [newUsers, latestMovies, latestComments] = await Promise.all([
      this.userModel
        .find({})
        .select('name email createdAt')
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean()
        .exec(),
      this.filmModel
        .find({})
        .select('slug title posterUrl view ratingAvg ratingCount')
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean()
        .exec(),
      this.commentModel
        .find({ isHidden: false })
        .select('content user film createdAt')
        .populate('user', 'name email')
        .populate('film', 'slug title')
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean()
        .exec(),
    ]);

    return {
      newUsers: newUsers.map((user) => ({
        id: String(user._id),
        name: user.name,
        email: user.email,
        createdAt: (user as unknown as { createdAt: Date }).createdAt,
      })),
      latestMovies: latestMovies.map((film) => toFilmSummary(film)),
      latestComments: latestComments.map((comment) => {
        const populatedUser = comment.user as unknown as {
          _id: unknown;
          name: string;
          email: string;
        } | null;
        const populatedFilm = comment.film as unknown as {
          _id: unknown;
          slug: string;
          title: string;
        } | null;
        return {
          id: String(comment._id),
          content: comment.content,
          user: populatedUser
            ? {
                id: String(populatedUser._id),
                name: populatedUser.name,
                email: populatedUser.email,
              }
            : null,
          film: populatedFilm
            ? {
                id: String(populatedFilm._id),
                slug: populatedFilm.slug,
                title: populatedFilm.title,
              }
            : null,
          createdAt: (comment as unknown as { createdAt: Date }).createdAt,
        };
      }),
    };
  }
}
