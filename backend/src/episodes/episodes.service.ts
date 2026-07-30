import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { FilmsService } from '../films/films.service';
import { CreateEpisodeDto } from './dto/create-episode.dto';
import { UpdateEpisodeDto } from './dto/update-episode.dto';
import { UpdateEpisodeOrderDto } from './dto/update-episode-order.dto';
import { Episode, EpisodeDocument } from './schemas/episode.schema';

@Injectable()
export class EpisodesService {
  constructor(
    @InjectModel(Episode.name) private readonly episodeModel: Model<EpisodeDocument>,
    private readonly filmsService: FilmsService,
  ) {}

  findByFilm(filmId: string) {
    return this.episodeModel
      .find({ filmId: new Types.ObjectId(filmId) })
      .sort({ displayOrder: 1 })
      .exec();
  }

  /** `displayOrder` LUÔN server-tính = số tập hiện có (append cuối) — validate phim tồn tại +
   * episodeNumber không trùng trước khi tạo (yêu cầu Phase 35: "Prevent duplicate episode numbers
   * in the same film", "editing deleted/nonexistent episodes" áp dụng tương tự cho phim cha ở bước
   * tạo). */
  async create(filmId: string, dto: CreateEpisodeDto): Promise<EpisodeDocument> {
    const film = await this.filmsService.findById(filmId);
    if (!film) {
      throw new NotFoundException('Không tìm thấy phim');
    }
    const filmObjectId = new Types.ObjectId(filmId);

    const [duplicate, displayOrder] = await Promise.all([
      this.episodeModel.findOne({ filmId: filmObjectId, episodeNumber: dto.episodeNumber }).exec(),
      this.episodeModel.countDocuments({ filmId: filmObjectId }).exec(),
    ]);
    if (duplicate) {
      throw new ConflictException(`Tập số ${dto.episodeNumber} đã tồn tại trong phim này`);
    }

    return this.episodeModel.create({
      filmId: filmObjectId,
      episodeNumber: dto.episodeNumber,
      title: dto.title,
      embedUrl: dto.embedUrl ?? '',
      m3u8Url: dto.m3u8Url ?? '',
      subtitleUrl: dto.subtitleUrl ?? '',
      duration: dto.duration ?? '',
      isPublished: dto.isPublished ?? true,
      displayOrder,
    });
  }

  async update(id: string, dto: UpdateEpisodeDto): Promise<EpisodeDocument> {
    const episode = await this.episodeModel.findById(id).exec();
    if (!episode) {
      throw new NotFoundException('Không tìm thấy tập phim');
    }

    if (dto.episodeNumber !== undefined && dto.episodeNumber !== episode.episodeNumber) {
      const duplicate = await this.episodeModel
        .findOne({
          filmId: episode.filmId,
          episodeNumber: dto.episodeNumber,
          _id: { $ne: episode._id },
        })
        .exec();
      if (duplicate) {
        throw new ConflictException(`Tập số ${dto.episodeNumber} đã tồn tại trong phim này`);
      }
    }

    const updated = await this.episodeModel.findByIdAndUpdate(id, { ...dto }, { new: true }).exec();
    return updated!;
  }

  /** Xoá xong DỒN LẠI displayOrder các tập đứng sau (trong CÙNG phim) về liền kề — giữ bất biến
   * "0..N-1 liên tục" cho phim đó, để `updateOrder()` không phải quan tâm tới lỗ hổng thứ tự. Chỉ
   * UPDATE các tập bị ảnh hưởng thật (displayOrder lớn hơn tập vừa xoá), không đụng tới toàn bộ
   * danh sách — đúng yêu cầu "update only affected episodes". */
  async remove(id: string): Promise<void> {
    const episode = await this.episodeModel.findByIdAndDelete(id).exec();
    if (!episode) {
      throw new NotFoundException('Không tìm thấy tập phim');
    }

    await this.episodeModel
      .updateMany(
        { filmId: episode.filmId, displayOrder: { $gt: episode.displayOrder } },
        { $inc: { displayOrder: -1 } },
      )
      .exec();
  }

  /** Dịch chuyển TỐI THIỂU: chỉ các tập nằm giữa vị trí cũ và vị trí mới (trong cùng phim) bị dịch
   * đi 1, không ghi lại toàn bộ danh sách — 1 `updateMany` theo khoảng + 1 `findByIdAndUpdate` cho
   * chính tập được di chuyển, đúng yêu cầu hiệu năng "update only affected episodes when
   * reordering" và tránh N+1 (không lặp update từng tập một). `displayOrder` mới phải nằm trong
   * [0, tổng số tập) — nhờ bất biến "0..N-1 liên tục" được `create()`/`remove()` duy trì, đây là
   * validate "invalid displayOrder" đơn giản và luôn đúng, không cần biết vị trí tối đa thực tế. */
  async updateOrder(id: string, dto: UpdateEpisodeOrderDto): Promise<EpisodeDocument> {
    const episode = await this.episodeModel.findById(id).exec();
    if (!episode) {
      throw new NotFoundException('Không tìm thấy tập phim');
    }

    const totalCount = await this.episodeModel.countDocuments({ filmId: episode.filmId }).exec();
    if (dto.displayOrder >= totalCount) {
      throw new BadRequestException(
        `displayOrder không hợp lệ — phải nhỏ hơn tổng số tập hiện có (${totalCount})`,
      );
    }

    const oldPos = episode.displayOrder;
    const newPos = dto.displayOrder;
    if (oldPos === newPos) {
      return episode;
    }

    if (newPos > oldPos) {
      await this.episodeModel
        .updateMany(
          { filmId: episode.filmId, displayOrder: { $gt: oldPos, $lte: newPos } },
          { $inc: { displayOrder: -1 } },
        )
        .exec();
    } else {
      await this.episodeModel
        .updateMany(
          { filmId: episode.filmId, displayOrder: { $gte: newPos, $lt: oldPos } },
          { $inc: { displayOrder: 1 } },
        )
        .exec();
    }

    const updated = await this.episodeModel
      .findByIdAndUpdate(id, { displayOrder: newPos }, { new: true })
      .exec();
    return updated!;
  }
}
