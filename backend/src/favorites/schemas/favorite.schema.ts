import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { FavoriteTargetType } from '../../common/constants';

export type FavoriteDocument = Favorite & Document;

@Schema({ timestamps: { createdAt: true, updatedAt: false }, collection: 'favorites' })
export class Favorite {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({ type: String, enum: FavoriteTargetType, required: true })
  targetType: FavoriteTargetType;

  // Không dùng `refPath` vì giá trị FavoriteTargetType (lowercase) không khớp
  // với tên model Mongoose thực tế ('Film' / 'Actor'). Resolve thủ công ở service.
  @Prop({ type: Types.ObjectId, required: true })
  target: Types.ObjectId;

  // Được Mongoose tự thêm nhờ `timestamps: { createdAt: true }` ở trên,
  // khai báo ở đây (không dùng @Prop) chỉ để TypeScript biết kiểu dữ liệu.
  createdAt?: Date;
}

export const FavoriteSchema = SchemaFactory.createForClass(Favorite);

FavoriteSchema.index({ user: 1, targetType: 1, target: 1 }, { unique: true });
FavoriteSchema.index({ user: 1, targetType: 1 });
