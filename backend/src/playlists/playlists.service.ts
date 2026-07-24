import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreatePlaylistDto } from './dto/create-playlist.dto';
import { UpdatePlaylistDto } from './dto/update-playlist.dto';
import { Playlist, PlaylistDocument } from './schemas/playlist.schema';

@Injectable()
export class PlaylistsService {
  constructor(
    @InjectModel(Playlist.name) private readonly playlistModel: Model<PlaylistDocument>,
  ) {}

  async create(userId: string, dto: CreatePlaylistDto): Promise<PlaylistDocument> {
    return this.playlistModel.create({ ...dto, user: userId });
  }

  findMine(userId: string): Promise<PlaylistDocument[]> {
    return this.playlistModel.find({ user: userId }).sort({ createdAt: -1 }).exec();
  }

  async findOne(userId: string, id: string): Promise<PlaylistDocument> {
    const playlist = await this.playlistModel
      .findOne({ _id: id, user: userId })
      .populate('films', 'title slug posterUrl thumbUrl category episodeCurrent')
      .exec();
    if (!playlist) {
      throw new NotFoundException('Không tìm thấy danh sách phim');
    }
    return playlist;
  }

  async update(userId: string, id: string, dto: UpdatePlaylistDto): Promise<PlaylistDocument> {
    const playlist = await this.playlistModel
      .findOneAndUpdate({ _id: id, user: userId }, dto, { new: true })
      .exec();
    if (!playlist) {
      throw new NotFoundException('Không tìm thấy danh sách phim');
    }
    return playlist;
  }

  async remove(userId: string, id: string): Promise<void> {
    const result = await this.playlistModel.findOneAndDelete({ _id: id, user: userId }).exec();
    if (!result) {
      throw new NotFoundException('Không tìm thấy danh sách phim');
    }
  }

  async addFilm(userId: string, id: string, filmId: string): Promise<PlaylistDocument> {
    const playlist = await this.playlistModel
      .findOneAndUpdate(
        { _id: id, user: userId },
        { $addToSet: { films: filmId } },
        { new: true },
      )
      .exec();
    if (!playlist) {
      throw new NotFoundException('Không tìm thấy danh sách phim');
    }
    return playlist;
  }

  async removeFilm(userId: string, id: string, filmId: string): Promise<PlaylistDocument> {
    const playlist = await this.playlistModel
      .findOneAndUpdate({ _id: id, user: userId }, { $pull: { films: filmId } }, { new: true })
      .exec();
    if (!playlist) {
      throw new NotFoundException('Không tìm thấy danh sách phim');
    }
    return playlist;
  }
}
