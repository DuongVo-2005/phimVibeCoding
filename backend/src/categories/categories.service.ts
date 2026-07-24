import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { Film, FilmDocument } from '../films/schemas/film.schema';
import { toSlug } from '../common/utils/slugify.util';
import { CreateCategoryDto } from './dto/create-category.dto';
import { QueryCategoryDto } from './dto/query-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Category, CategoryDocument } from './schemas/category.schema';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Category.name) private readonly categoryModel: Model<CategoryDocument>,
    @InjectModel(Film.name) private readonly filmModel: Model<FilmDocument>,
  ) {}

  findAll(query: QueryCategoryDto) {
    const filter: FilterQuery<CategoryDocument> = {
      isActive: query.isActive ?? true,
    };
    return this.categoryModel.find(filter).sort({ name: 1 }).exec();
  }

  findHot() {
    return this.categoryModel.find({ isHot: true }).sort({ name: 1 }).exec();
  }

  async findBySlug(slug: string): Promise<CategoryDocument> {
    const category = await this.categoryModel.findOne({ slug }).exec();
    if (!category) {
      throw new NotFoundException('Không tìm thấy danh mục');
    }
    return category;
  }

  findById(id: string) {
    return this.categoryModel.findById(id).exec();
  }

  async create(dto: CreateCategoryDto): Promise<CategoryDocument> {
    const slug = toSlug(dto.name);
    const existing = await this.categoryModel.findOne({ slug }).exec();
    if (existing) {
      throw new ConflictException('Danh mục đã tồn tại');
    }
    return this.categoryModel.create({ ...dto, slug });
  }

  /** Dùng bởi OphimMapperService khi map category của phim sang danh mục nội bộ. */
  async findOrCreateByName(name: string): Promise<CategoryDocument> {
    const slug = toSlug(name);
    const existing = await this.categoryModel.findOne({ slug }).exec();
    if (existing) {
      return existing;
    }
    return this.categoryModel.create({ name, slug });
  }

  // Không tự suy `slug` lại từ `name` khi update (khác Actors/Directors/Countries) — slug là URL
  // công khai của danh mục, phải ổn định kể cả khi admin đổi tên/SEO, nếu không sẽ gãy link cũ.
  async update(id: string, dto: UpdateCategoryDto): Promise<CategoryDocument> {
    const category = await this.categoryModel.findByIdAndUpdate(id, dto, { new: true }).exec();
    if (!category) {
      throw new NotFoundException('Không tìm thấy danh mục');
    }
    return category;
  }

  async remove(id: string): Promise<void> {
    const category = await this.categoryModel.findById(id).exec();
    if (!category) {
      throw new NotFoundException('Không tìm thấy danh mục');
    }

    const filmCount = await this.filmModel.countDocuments({ categories: category._id }).exec();
    if (filmCount > 0) {
      throw new ConflictException(`Không thể xoá — đang được sử dụng bởi ${filmCount} phim`);
    }

    await this.categoryModel.findByIdAndDelete(id).exec();
  }
}
