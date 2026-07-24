import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { FilmCategory, FilmStatus } from '../../common/constants';

export type FilmDocument = Film & Document;

/** Field dùng cho MongoDB text-index language override — không phải "language" (đã bị Film.language chiếm). */
export const FILM_TEXT_INDEX_LANGUAGE_OVERRIDE = 'textSearchLanguage';

@Schema({ _id: false })
export class EpisodeItem {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  slug: string;

  @Prop({ default: '' })
  embedUrl: string;

  @Prop({ default: '' })
  m3u8Url: string;
}
export const EpisodeItemSchema = SchemaFactory.createForClass(EpisodeItem);

@Schema({ _id: false })
export class EpisodeServer {
  @Prop({ required: true })
  serverName: string;

  @Prop({ type: [EpisodeItemSchema], default: [] })
  items: EpisodeItem[];
}
export const EpisodeServerSchema = SchemaFactory.createForClass(EpisodeServer);

@Schema({ timestamps: true, collection: 'films' })
export class Film {
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  slug: string;

  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ default: '' })
  originalTitle: string;

  @Prop({ default: '' })
  description: string;

  @Prop({ default: '' })
  posterUrl: string;

  @Prop({ default: '' })
  thumbUrl: string;

  @Prop({ default: '' })
  trailerUrl: string;

  @Prop({ type: String, enum: FilmCategory, default: FilmCategory.SINGLE })
  category: FilmCategory;

  @Prop({ default: '' })
  episodeCurrent: string;

  @Prop({ default: '' })
  episodeTotal: string;

  @Prop({ default: '' })
  duration: string;

  @Prop({ default: '' })
  quality: string;

  @Prop({ default: '' })
  language: string;

  @Prop({ type: Number, default: null })
  releaseYear: number | null;

  // CHANGED (Phase 4 — Film Relationship Refactor): trước là chuỗi tự do (dễ trùng lặp/lỗi chính
  // tả, không có trang chi tiết quốc gia/đạo diễn riêng) — nay là ref sang Country/Director, resolve-
  // or-create theo tên qua CountriesService/DirectorsService.findOrCreateByName (crawler) hoặc chọn
  // trực tiếp bằng ObjectId (admin). Một phim có thể có nhiều quốc gia/đạo diễn nên dùng mảng.
  @Prop({ type: [Types.ObjectId], ref: 'Country', default: [] })
  countries: Types.ObjectId[];

  @Prop({ type: [Types.ObjectId], ref: 'Director', default: [] })
  directors: Types.ObjectId[];

  @Prop({ type: [Types.ObjectId], ref: 'Actor', default: [] })
  actors: Types.ObjectId[];

  // Đổi tên field types -> categories (Phase 4.5 — API Stabilization), ref sang model "Category"
  // (đổi tên từ "Type" ở Phase 3). Dữ liệu cũ được migrate qua migrate-films-categories-published.ts.
  @Prop({ type: [Types.ObjectId], ref: 'Category', default: [] })
  categories: Types.ObjectId[];

  @Prop({ type: [EpisodeServerSchema], default: [] })
  episodes: EpisodeServer[];

  @Prop({ default: 0 })
  view: number;

  @Prop({ default: 0 })
  ratingAvg: number;

  @Prop({ default: 0 })
  ratingCount: number;

  @Prop({ default: 0 })
  commentCount: number;

  @Prop({ default: false })
  isHot: boolean;

  // Trạng thái ẩn/hiện mềm (Phase 4.5) — thay cho xoá cứng: phim ẩn (false) biến mất khỏi mọi API
  // công khai nhưng vẫn giữ nguyên comment/rating/history/favorite/playlist đang tham chiếu tới nó.
  // Chỉ Admin (qua GET /films?isPublished=) mới thấy được phim ẩn.
  @Prop({ default: true })
  isPublished: boolean;

  @Prop({ type: String, enum: FilmStatus, default: FilmStatus.COMPLETED })
  status: FilmStatus;

  // Nguồn gốc dữ liệu (đồng bộ từ ophim.cc) — dùng để crawler upsert idempotent
  @Prop({ type: String, default: null })
  sourceSlug: string | null;

  @Prop({ type: Date, default: null })
  sourceUpdatedAt: Date | null;
}

export const FilmSchema = SchemaFactory.createForClass(Film);

FilmSchema.index({ view: -1 });
FilmSchema.index({ ratingAvg: -1 });
FilmSchema.index({ categories: 1 });
FilmSchema.index({ category: 1 });
FilmSchema.index({ countries: 1 });
FilmSchema.index({ directors: 1 });
FilmSchema.index({ isPublished: 1 });
// language_override: field `language` của Film dùng để lưu ngôn ngữ lồng tiếng/phụ đề (vd: "Vietsub"),
// không liên quan tới text search. Nếu không đổi field mặc định, MongoDB sẽ coi `language` là cờ
// chọn ngôn ngữ stemming cho text index và lỗi với các giá trị như "Vietsub" (not a valid language).
FilmSchema.index(
  { title: 'text', originalTitle: 'text' },
  { language_override: FILM_TEXT_INDEX_LANGUAGE_OVERRIDE },
);
