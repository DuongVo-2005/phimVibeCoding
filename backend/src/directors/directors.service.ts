import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { PaginatedResponseDto } from '../common/dto/paginated-response.dto';
import { toSlug } from '../common/utils/slugify.util';
import { CreateDirectorDto } from './dto/create-director.dto';
import { QueryDirectorDto } from './dto/query-director.dto';
import { UpdateDirectorDto } from './dto/update-director.dto';
import { Director, DirectorDocument } from './schemas/director.schema';

@Injectable()
export class DirectorsService {
  constructor(
    @InjectModel(Director.name) private readonly directorModel: Model<DirectorDocument>,
  ) {}

  async findAll(query: QueryDirectorDto): Promise<PaginatedResponseDto<DirectorDocument>> {
    const filter: FilterQuery<DirectorDocument> = {};

    if (query.search) {
      filter.$text = { $search: query.search };
    }

    const sortField = query.sortBy ?? 'name';
    const sortOrder = query.sortOrder === 'desc' ? -1 : 1;

    const [items, totalItems] = await Promise.all([
      this.directorModel
        .find(filter)
        .sort({ [sortField]: sortOrder })
        .skip(query.skip)
        .limit(query.limit)
        .exec(),
      this.directorModel.countDocuments(filter).exec(),
    ]);

    return new PaginatedResponseDto(items, totalItems, query.page, query.limit);
  }

  async findBySlug(slug: string): Promise<DirectorDocument> {
    const director = await this.directorModel.findOne({ slug }).exec();
    if (!director) {
      throw new NotFoundException('Không tìm thấy đạo diễn');
    }
    return director;
  }

  findById(id: string) {
    return this.directorModel.findById(id).exec();
  }

  async create(dto: CreateDirectorDto): Promise<DirectorDocument> {
    const slug = toSlug(dto.name);
    const existing = await this.directorModel.findOne({ slug }).exec();
    if (existing) {
      throw new ConflictException('Đạo diễn đã tồn tại');
    }
    return this.directorModel.create({ ...dto, slug });
  }

  async findOrCreateByName(name: string): Promise<DirectorDocument> {
    const slug = toSlug(name);
    const existing = await this.directorModel.findOne({ slug }).exec();
    if (existing) {
      return existing;
    }
    return this.directorModel.create({ name, slug });
  }

  async update(id: string, dto: UpdateDirectorDto): Promise<DirectorDocument> {
    const update: Partial<Director> & { slug?: string } = { ...dto } as any;
    if (dto.name) {
      update.slug = toSlug(dto.name);
    }
    const director = await this.directorModel.findByIdAndUpdate(id, update, { new: true }).exec();
    if (!director) {
      throw new NotFoundException('Không tìm thấy đạo diễn');
    }
    return director;
  }

  async remove(id: string): Promise<void> {
    const result = await this.directorModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException('Không tìm thấy đạo diễn');
    }
  }
}
