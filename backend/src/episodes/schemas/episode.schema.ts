import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type EpisodeDocument = Episode & Document;

/**
 * Episode — Phase 35 (Episode Management API). Collection ĐỘC LẬP hoàn toàn với `Film.episodes`
 * (embedded, dùng bởi crawler + trang xem phim công khai — xem ADR đã duyệt trước phase này).
 * KHÔNG đọc/ghi vào `Film.episodes`, KHÔNG có ref ngược từ `Film`. Đây là kiến trúc TẠM THỜI có
 * chủ đích: admin quản lý tập phim qua collection này, phát trực tuyến công khai vẫn đọc
 * `Film.episodes` như cũ — một phase di trú SAU NÀY sẽ quyết định có gộp 2 hệ thống hay không (xem
 * RELEASE_NOTES.md và báo cáo Phase 35).
 */
@Schema({ timestamps: true, collection: 'episodes' })
export class Episode {
  @Prop({ type: Types.ObjectId, ref: 'Film', required: true })
  filmId: Types.ObjectId;

  @Prop({ required: true, min: 1 })
  episodeNumber: number;

  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ default: '' })
  embedUrl: string;

  @Prop({ default: '' })
  m3u8Url: string;

  @Prop({ default: '' })
  subtitleUrl: string;

  @Prop({ default: '' })
  duration: string;

  @Prop({ default: true })
  isPublished: boolean;

  // Thứ hạng hiển thị, ĐỘC LẬP với episodeNumber (admin có thể muốn sắp xếp khác thứ tự số, vd.
  // tập đặc biệt) — quản lý HOÀN TOÀN qua `EpisodesService` (append khi tạo, dồn lại khi xoá, dịch
  // chuyển tối thiểu khi PATCH .../order — xem ghi chú service), KHÔNG cho client set trực tiếp qua
  // create/update DTO để tránh 2 luồng ghi tranh chấp cùng 1 bất biến "0..N-1 liên tục".
  @Prop({ required: true, default: 0 })
  displayOrder: number;
}

export const EpisodeSchema = SchemaFactory.createForClass(Episode);

// Chặn trùng episodeNumber trong cùng 1 phim ở tầng DB (an toàn cuối cùng, ngoài check tường minh ở
// service) — yêu cầu Phase 35 "Prevent duplicate episode numbers in the same film".
EpisodeSchema.index({ filmId: 1, episodeNumber: 1 }, { unique: true });
EpisodeSchema.index({ filmId: 1, displayOrder: 1 });
