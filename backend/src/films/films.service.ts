import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import { PaginatedResponseDto } from '../common/dto/paginated-response.dto';
import { toSlug } from '../common/utils/slugify.util';
import { CreateFilmDto } from './dto/create-film.dto';
import { QueryFilmDto } from './dto/query-film.dto';
import { UpdateFilmDto } from './dto/update-film.dto';
import { Film, FilmDocument } from './schemas/film.schema';

const REF_ARRAY_FIELDS = ['actors', 'categories', 'countries', 'directors'] as const;
export const FILM_TOP_METRICS = ['view', 'ratingAvg'] as const;
export type FilmTopMetric = (typeof FILM_TOP_METRICS)[number];

/**
 * Model.create()/findByIdAndUpdate() không luôn cast đáng tin cậy chuỗi ObjectId bên trong mảng
 * kiểu [Types.ObjectId] (cùng lỗi đã gặp với insertMany()/create() ở Phase 2-3) — ép kiểu tường
 * minh trước khi ghi để các query lọc theo ref sau này (vd. GET /films?country=slug) khớp đúng.
 */
function castRefArrays(dto: Partial<CreateFilmDto>): Partial<Record<string, Types.ObjectId[]>> {
  const casted: Partial<Record<string, Types.ObjectId[]>> = {};
  for (const field of REF_ARRAY_FIELDS) {
    const value = (dto as Record<string, unknown>)[field];
    if (Array.isArray(value)) {
      casted[field] = value.map((id) => new Types.ObjectId(id as string));
    }
  }
  return casted;
}

@Injectable()
export class FilmsService {
  constructor(@InjectModel(Film.name) private readonly filmModel: Model<FilmDocument>) {}

  async findAll(
    query: QueryFilmDto,
    isAdmin = false,
  ): Promise<PaginatedResponseDto<FilmDocument>> {
    const filter: FilterQuery<FilmDocument> = {};

    if (!isAdmin) {
      filter.isPublished = true;
    } else if (query.isPublished !== undefined) {
      filter.isPublished = query.isPublished;
    }

    if (query.search) {
      filter.$text = { $search: query.search };
    }
    if (query.format) {
      filter.category = query.format;
    }
    if (query.status) {
      filter.status = query.status;
    }
    if (query.year) {
      filter.releaseYear = parseInt(query.year, 10);
    }
    // `type` là alias tương thích ngược của `category` (đổi tên Phase 4.5) — cùng ý nghĩa: slug
    // thể loại. Ưu tiên `category` nếu client vô tình truyền cả hai.
    const categorySlug = query.category ?? query.type;
    if (categorySlug) {
      const categoryDoc = await this.filmModel.db
        .collection('categories')
        .findOne({ slug: categorySlug });
      filter.categories = categoryDoc ? categoryDoc._id : new Types.ObjectId();
    }
    if (query.country) {
      // country giờ là ref (Phase 4) — lọc theo slug, cùng pattern với `type` ở trên (truy vấn
      // trực tiếp collection thay vì import CountriesModule vào FilmsModule, tránh phụ thuộc chéo).
      const countryDoc = await this.filmModel.db
        .collection('countries')
        .findOne({ slug: query.country });
      filter.countries = countryDoc ? countryDoc._id : new Types.ObjectId();
    }
    if (query.director) {
      const directorDoc = await this.filmModel.db
        .collection('directors')
        .findOne({ slug: query.director });
      filter.directors = directorDoc ? directorDoc._id : new Types.ObjectId();
    }

    const sortField = query.sortBy ?? 'createdAt';
    const sortOrder = query.sortOrder === 'asc' ? 1 : -1;

    const [items, totalItems] = await Promise.all([
      this.filmModel
        .find(filter)
        .populate('categories', 'name slug')
        .populate('countries', 'name slug')
        .populate('directors', 'name slug')
        .sort({ [sortField]: sortOrder })
        .skip(query.skip)
        .limit(query.limit)
        .exec(),
      this.filmModel.countDocuments(filter).exec(),
    ]);

    return new PaginatedResponseDto(items, totalItems, query.page, query.limit);
  }

  /** metric='view' (mặc định): top theo lượt xem. metric='ratingAvg': top theo điểm đánh giá
   * trung bình, hoà điểm được phân định bằng ratingCount desc (tránh 1 vote 10/10 vượt mặt phim
   * đã có nhiều lượt đánh giá ổn định). */
  findTop(limit = 10, metric: FilmTopMetric = 'view') {
    const query = this.filmModel.find({ isPublished: true });
    if (metric === 'ratingAvg') {
      query.sort({ ratingAvg: -1, ratingCount: -1 });
    } else {
      query.sort({ view: -1 });
    }
    return query.limit(limit).exec();
  }

  findHot(limit = 10) {
    return this.filmModel
      .find({ isHot: true, isPublished: true })
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
  }

  findLatestSeries(limit = 10) {
    return this.filmModel
      .find({ category: 'series', isPublished: true })
      .sort({ updatedAt: -1 })
      .limit(limit)
      .exec();
  }

  /** Phim được xếp hạng theo commentCount (đã denormalize sẵn trên Film) — widget "bình luận sôi
   * nổi" ở trang chủ. */
  findMostCommented(limit = 10) {
    return this.filmModel
      .find({ isPublished: true })
      .sort({ commentCount: -1 })
      .limit(limit)
      .exec();
  }

  async findBySlug(slug: string): Promise<FilmDocument> {
    const film = await this.filmModel
      .findOne({ slug, isPublished: true })
      .populate('actors', 'name slug avatar')
      .populate('categories', 'name slug')
      .populate('countries', 'name slug')
      .populate('directors', 'name slug')
      .exec();
    if (!film) {
      throw new NotFoundException('Không tìm thấy phim');
    }
    return film;
  }

  findById(id: string) {
    return this.filmModel.findById(id).exec();
  }

  async findRelated(slug: string, limit = 12): Promise<FilmDocument[]> {
    const film = await this.filmModel.findOne({ slug }).exec();
    if (!film) {
      throw new NotFoundException('Không tìm thấy phim');
    }
    return this.filmModel
      .find({ _id: { $ne: film._id }, categories: { $in: film.categories }, isPublished: true })
      .sort({ view: -1 })
      .limit(limit)
      .exec();
  }

  async incrementView(slug: string): Promise<{ view: number }> {
    const film = await this.filmModel
      .findOneAndUpdate({ slug }, { $inc: { view: 1 } }, { new: true })
      .exec();
    if (!film) {
      throw new NotFoundException('Không tìm thấy phim');
    }
    return { view: film.view };
  }

  async create(dto: CreateFilmDto): Promise<FilmDocument> {
    const slug = toSlug(dto.title);
    return this.filmModel.create({ ...dto, ...castRefArrays(dto), slug });
  }

  async update(id: string, dto: UpdateFilmDto): Promise<FilmDocument> {
    const film = await this.filmModel
      .findByIdAndUpdate(id, { ...dto, ...castRefArrays(dto) }, { new: true })
      .exec();
    if (!film) {
      throw new NotFoundException('Không tìm thấy phim');
    }
    return film;
  }

  async remove(id: string): Promise<void> {
    const result = await this.filmModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException('Không tìm thấy phim');
    }
  }

  /** Dùng bởi CrawlerModule: idempotent upsert theo slug (insert nếu chưa có, update nếu đã tồn tại). */
  async upsertBySlug(
    slug: string,
    data: Partial<Film>,
  ): Promise<{ film: FilmDocument; isNew: boolean }> {
    const result = await this.filmModel
      .findOneAndUpdate(
        { slug },
        { $set: { ...data, slug } },
        { new: true, upsert: true, setDefaultsOnInsert: true, includeResultMetadata: true },
      )
      .exec();

    return { film: result.value as FilmDocument, isNew: !result.lastErrorObject?.updatedExisting };
  }

  async recalculateRating(filmId: Types.ObjectId | string, ratingAvg: number, ratingCount: number) {
    await this.filmModel.findByIdAndUpdate(filmId, { ratingAvg, ratingCount }).exec();
  }

  async incrementCommentCount(filmId: Types.ObjectId | string, delta: number) {
    await this.filmModel.findByIdAndUpdate(filmId, { $inc: { commentCount: delta } }).exec();
  }
}
