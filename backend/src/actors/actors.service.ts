import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { PaginatedResponseDto } from '../common/dto/paginated-response.dto';
import { escapeRegExp } from '../common/utils/regex-escape.util';
import { toSlug } from '../common/utils/slugify.util';
import { CreateActorDto } from './dto/create-actor.dto';
import { QueryActorDto } from './dto/query-actor.dto';
import { UpdateActorDto } from './dto/update-actor.dto';
import { Actor, ActorDocument } from './schemas/actor.schema';

@Injectable()
export class ActorsService {
  constructor(@InjectModel(Actor.name) private readonly actorModel: Model<ActorDocument>) {}

  async findAll(query: QueryActorDto): Promise<PaginatedResponseDto<ActorDocument>> {
    const filter: FilterQuery<ActorDocument> = {};

    if (query.search) {
      filter.$text = { $search: query.search };
    }

    if (query.letter) {
      filter.name = new RegExp(`^${escapeRegExp(query.letter)}`, 'i');
    }

    const sortField = query.sortBy ?? 'name';
    const sortOrder = query.sortOrder === 'desc' ? -1 : 1;

    const [items, totalItems] = await Promise.all([
      this.actorModel
        .find(filter)
        .sort({ [sortField]: sortOrder })
        .skip(query.skip)
        .limit(query.limit)
        .exec(),
      this.actorModel.countDocuments(filter).exec(),
    ]);

    return new PaginatedResponseDto(items, totalItems, query.page, query.limit);
  }

  async findBySlug(slug: string): Promise<ActorDocument> {
    const actor = await this.actorModel.findOne({ slug }).exec();
    if (!actor) {
      throw new NotFoundException('Không tìm thấy diễn viên');
    }
    return actor;
  }

  findById(id: string) {
    return this.actorModel.findById(id).exec();
  }

  async create(dto: CreateActorDto): Promise<ActorDocument> {
    const slug = toSlug(dto.name);
    const existing = await this.actorModel.findOne({ slug }).exec();
    if (existing) {
      throw new ConflictException('Diễn viên đã tồn tại');
    }
    return this.actorModel.create({ ...dto, slug });
  }

  async findOrCreateByName(name: string): Promise<ActorDocument> {
    const slug = toSlug(name);
    const existing = await this.actorModel.findOne({ slug }).exec();
    if (existing) {
      return existing;
    }
    return this.actorModel.create({ name, slug });
  }

  async update(id: string, dto: UpdateActorDto): Promise<ActorDocument> {
    const update: Partial<Actor> & { slug?: string } = { ...dto } as any;
    if (dto.name) {
      update.slug = toSlug(dto.name);
    }
    const actor = await this.actorModel.findByIdAndUpdate(id, update, { new: true }).exec();
    if (!actor) {
      throw new NotFoundException('Không tìm thấy diễn viên');
    }
    return actor;
  }

  async remove(id: string): Promise<void> {
    const result = await this.actorModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException('Không tìm thấy diễn viên');
    }
  }
}
