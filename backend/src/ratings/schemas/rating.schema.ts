import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type RatingDocument = Rating & Document;

@Schema({ timestamps: true, collection: 'ratings' })
export class Rating {
  @Prop({ type: Types.ObjectId, ref: 'Film', required: true })
  film: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({ required: true, min: 1, max: 10 })
  score: number;
}

export const RatingSchema = SchemaFactory.createForClass(Rating);

RatingSchema.index({ film: 1, user: 1 }, { unique: true });
