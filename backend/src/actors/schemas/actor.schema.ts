import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ActorDocument = Actor & Document;

@Schema({ timestamps: true, collection: 'actors' })
export class Actor {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  slug: string;

  @Prop({ default: '' })
  avatar: string;

  @Prop({ default: '' })
  bio: string;

  @Prop({ type: Date, default: null })
  birthday: Date | null;

  @Prop({ default: '' })
  nationality: string;
}

export const ActorSchema = SchemaFactory.createForClass(Actor);
ActorSchema.index({ name: 'text' });
