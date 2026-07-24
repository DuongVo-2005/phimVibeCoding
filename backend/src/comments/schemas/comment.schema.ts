import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CommentDocument = Comment & Document;

@Schema({ timestamps: true, collection: 'comments' })
export class Comment {
  @Prop({ type: Types.ObjectId, ref: 'Film', required: true })
  film: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({ required: true, trim: true })
  content: string;

  @Prop({ type: Types.ObjectId, ref: 'Comment', default: null })
  parent: Types.ObjectId | null;

  @Prop({ default: 0 })
  upVoteCount: number;

  @Prop({ default: 0 })
  downVoteCount: number;

  // Soft-moderation (Phase 5.3) — ẩn bình luận khỏi mọi listing công khai nhưng giữ nguyên
  // upVoteCount/downVoteCount và cấu trúc reply-thread (khác DELETE cứng, tránh mồ côi reply).
  // Chỉ phục vụ moderation, không ảnh hưởng field khác.
  @Prop({ default: false })
  isHidden: boolean;

  // Được Mongoose tự thêm nhờ `timestamps: true` ở trên, khai báo ở đây (không dùng @Prop) chỉ để
  // TypeScript biết kiểu dữ liệu — cần cho việc kiểm tra cửa sổ chỉnh sửa 15 phút (Phase 5.3).
  createdAt?: Date;
  updatedAt?: Date;
}

export const CommentSchema = SchemaFactory.createForClass(Comment);

CommentSchema.index({ film: 1, createdAt: -1 });
CommentSchema.index({ film: 1, upVoteCount: -1 });
CommentSchema.index({ createdAt: -1 });
CommentSchema.index({ parent: 1 });
CommentSchema.index({ isHidden: 1 });
