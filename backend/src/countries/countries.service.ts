import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { toSlug } from '../common/utils/slugify.util';
import { CreateCountryDto } from './dto/create-country.dto';
import { UpdateCountryDto } from './dto/update-country.dto';
import { Country, CountryDocument } from './schemas/country.schema';

@Injectable()
export class CountriesService {
  constructor(@InjectModel(Country.name) private readonly countryModel: Model<CountryDocument>) {}

  findAll() {
    return this.countryModel.find().sort({ name: 1 }).exec();
  }

  async findBySlug(slug: string): Promise<CountryDocument> {
    const country = await this.countryModel.findOne({ slug }).exec();
    if (!country) {
      throw new NotFoundException('Không tìm thấy quốc gia');
    }
    return country;
  }

  async create(dto: CreateCountryDto): Promise<CountryDocument> {
    const slug = toSlug(dto.name);
    const existing = await this.countryModel.findOne({ slug }).exec();
    if (existing) {
      throw new ConflictException('Quốc gia đã tồn tại');
    }
    return this.countryModel.create({ ...dto, slug });
  }

  async findOrCreateByName(name: string): Promise<CountryDocument> {
    const slug = toSlug(name);
    const existing = await this.countryModel.findOne({ slug }).exec();
    if (existing) {
      return existing;
    }
    return this.countryModel.create({ name, slug });
  }

  async update(id: string, dto: UpdateCountryDto): Promise<CountryDocument> {
    const update: Partial<Country> & { slug?: string } = { ...dto };
    if (dto.name) {
      update.slug = toSlug(dto.name);
    }
    const country = await this.countryModel.findByIdAndUpdate(id, update, { new: true }).exec();
    if (!country) {
      throw new NotFoundException('Không tìm thấy quốc gia');
    }
    return country;
  }

  async remove(id: string): Promise<void> {
    const result = await this.countryModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException('Không tìm thấy quốc gia');
    }
  }
}
