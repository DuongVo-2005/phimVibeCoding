import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type DirectorDocument = Director & Document;

@Schema({ timestamps: true, collection: 'directors' })
export class Director {
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

export const DirectorSchema = SchemaFactory.createForClass(Director);
DirectorSchema.index({ name: 'text' });
