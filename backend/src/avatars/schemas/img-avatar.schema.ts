import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ImgAvatarDocument = ImgAvatar & Document;

@Schema({ timestamps: { createdAt: true, updatedAt: false }, collection: 'img_avatars' })
export class ImgAvatar {
  @Prop({ type: Types.ObjectId, ref: 'TypeAvatar', required: true })
  type: Types.ObjectId;

  @Prop({ required: true, trim: true })
  url: string;
}

export const ImgAvatarSchema = SchemaFactory.createForClass(ImgAvatar);

ImgAvatarSchema.index({ type: 1 });
