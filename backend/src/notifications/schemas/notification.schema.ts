import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';
import { NotificationType } from '../../common/constants';

export type NotificationDocument = Notification & Document;

@Schema({ timestamps: { createdAt: true, updatedAt: false }, collection: 'notifications' })
export class Notification {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: String, enum: NotificationType, required: true })
  type: NotificationType;

  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true, trim: true })
  message: string;

  /** Dữ liệu phụ tuỳ loại thông báo (vd. `{filmId, commentId}` cho loại `comment`) — cấu trúc tự
   * do theo `type`, không ràng buộc schema con cụ thể (đúng field `metadata` theo yêu cầu Phase 34,
   * khác `link` đơn giản ở thiết kế cũ trong api_design.md §19 — metadata linh hoạt hơn). */
  @Prop({ type: MongooseSchema.Types.Mixed, default: null })
  metadata: Record<string, unknown> | null;

  @Prop({ default: false })
  isRead: boolean;

  // Được Mongoose tự thêm nhờ `timestamps: { createdAt: true }` ở trên, khai báo ở đây (không dùng
  // @Prop) chỉ để TypeScript biết kiểu dữ liệu.
  createdAt?: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, isRead: 1 });
