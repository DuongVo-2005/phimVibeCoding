import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CategoryDocument = Category & Document;

@Schema({ timestamps: true, collection: 'categories' })
export class Category {
  @Prop({ required: true, trim: true })
  name: string;

  /** Slug của ta — admin có thể chỉnh sửa, không nhất thiết trùng sourceSlug từ Ophim. */
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  slug: string;

  /** Các field dưới đây là nội dung do admin biên tập — sync KHÔNG BAO GIỜ được ghi đè chúng. */
  @Prop({ default: '' })
  description: string;

  @Prop({ default: '' })
  seoTitle: string;

  @Prop({ default: '' })
  seoDescription: string;

  /** 'ophim' nếu được đồng bộ từ Ophim, null nếu tạo thủ công. */
  @Prop({ type: String, default: null })
  source: string | null;

  /** Slug gốc bên Ophim — khoá để khớp khi đồng bộ lại (không dùng `slug` vì slug có thể bị admin đổi).
   * KHÔNG đặt `default: null` — field này có unique+sparse index bên dưới; `sparse` chỉ loại trừ
   * document THIẾU HẲN field, không loại trừ field có giá trị `null` tường minh. `default: null`
   * khiến Mongoose luôn ghi field này (giá trị null) trên MỌI category tạo tay, khiến category tạo
   * tay thứ 2 trở đi vi phạm unique index (đã xác nhận bằng lỗi E11000 thật, Phase 19B.3 QA) — category
   * tạo tay giờ không set field này nên nó vắng mặt hẳn, đúng ý nghĩa `sparse` ban đầu. `source`/
   * `sourceUpdatedAt` không có unique index nên giữ nguyên `default: null` (không có xung đột). */
  @Prop({ type: String })
  sourceSlug?: string | null;

  @Prop({ type: Date, default: null })
  sourceUpdatedAt: Date | null;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  isHot: boolean;
}

export const CategorySchema = SchemaFactory.createForClass(Category);

CategorySchema.index({ sourceSlug: 1 }, { unique: true, sparse: true });
CategorySchema.index({ isActive: 1 });
CategorySchema.index({ isHot: 1 });
