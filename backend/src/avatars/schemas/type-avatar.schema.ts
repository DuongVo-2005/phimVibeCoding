import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TypeAvatarDocument = TypeAvatar & Document;

@Schema({ timestamps: { createdAt: true, updatedAt: false }, collection: 'type_avatars' })
export class TypeAvatar {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  slug: string;
}

export const TypeAvatarSchema = SchemaFactory.createForClass(TypeAvatar);
