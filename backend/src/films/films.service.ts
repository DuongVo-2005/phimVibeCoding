import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import { PaginatedResponseDto } from '../common/dto/paginated-response.dto';
import { toSlug } from '../common/utils/slugify.util';
import { CreateFilmDto } from './dto/create-film.dto';
import { QueryFilmDto } from './dto/query-film.dto';
import { UpdateFilmDto } from './dto/update-film.dto';
import { Film, FilmDocument } from './schemas/film.schema';

const REF_ARRAY_FIELDS = ['actors', 'types', 'countries', 'directors'] as const;

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

  async findAll(query: QueryFilmDto): Promise<PaginatedResponseDto<FilmDocument>> {
    const filter: FilterQuery<FilmDocument> = {};

    if (query.search) {
      filter.$text = { $search: query.search };
    }
    if (query.category) {
      filter.category = query.category;
    }
    if (query.status) {
      filter.status = query.status;
    }
    if (query.year) {
      filter.releaseYear = parseInt(query.year, 10);
    }
    if (query.type) {
      // Collection đã đổi tên types -> categories (Phase 3); field `types` trên Film giữ nguyên tên
      // cho tới Phase 4.
      const categoryDoc = await this.filmModel.db
        .collection('categories')
        .findOne({ slug: query.type });
      filter.types = categoryDoc ? categoryDoc._id : new Types.ObjectId();
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
        .populate('types', 'name slug')
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

  findTop(limit = 10) {
    return this.filmModel.find().sort({ view: -1 }).limit(limit).exec();
  }

  findHot(limit = 10) {
    return this.filmModel.find({ isHot: true }).sort({ createdAt: -1 }).limit(limit).exec();
  }

  findLatestSeries(limit = 10) {
    return this.filmModel
      .find({ category: 'series' })
      .sort({ updatedAt: -1 })
      .limit(limit)
      .exec();
  }

  async findBySlug(slug: string): Promise<FilmDocument> {
    const film = await this.filmModel
      .findOne({ slug })
      .populate('actors', 'name slug avatar')
      .populate('types', 'name slug')
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
      .find({ _id: { $ne: film._id }, types: { $in: film.types } })
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
