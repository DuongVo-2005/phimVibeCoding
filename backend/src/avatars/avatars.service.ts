import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { toSlug } from '../common/utils/slugify.util';
import { CreateImgAvatarDto } from './dto/create-img-avatar.dto';
import { CreateTypeAvatarDto } from './dto/create-type-avatar.dto';
import { ImgAvatar, ImgAvatarDocument } from './schemas/img-avatar.schema';
import { TypeAvatar, TypeAvatarDocument } from './schemas/type-avatar.schema';

@Injectable()
export class AvatarsService {
  constructor(
    @InjectModel(TypeAvatar.name) private readonly typeAvatarModel: Model<TypeAvatarDocument>,
    @InjectModel(ImgAvatar.name) private readonly imgAvatarModel: Model<ImgAvatarDocument>,
  ) {}

  findAllTypes(): Promise<TypeAvatarDocument[]> {
    return this.typeAvatarModel.find().sort({ name: 1 }).exec();
  }

  findImages(typeId?: string): Promise<ImgAvatarDocument[]> {
    const filter = typeId ? { type: typeId } : {};
    return this.imgAvatarModel.find(filter).sort({ createdAt: -1 }).exec();
  }

  async createType(dto: CreateTypeAvatarDto): Promise<TypeAvatarDocument> {
    const slug = toSlug(dto.name);
    const existing = await this.typeAvatarModel.findOne({ slug }).exec();
    if (existing) {
      throw new ConflictException('Loại avatar đã tồn tại');
    }
    return this.typeAvatarModel.create({ ...dto, slug });
  }

  createImage(dto: CreateImgAvatarDto): Promise<ImgAvatarDocument> {
    return this.imgAvatarModel.create(dto);
  }

  async removeType(id: string): Promise<void> {
    const result = await this.typeAvatarModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException('Không tìm thấy loại avatar');
    }
  }

  async removeImage(id: string): Promise<void> {
    const result = await this.imgAvatarModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException('Không tìm thấy avatar');
    }
  }
}
