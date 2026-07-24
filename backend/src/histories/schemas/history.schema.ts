import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type HistoryDocument = History & Document;

@Schema({ timestamps: true, collection: 'histories' })
export class History {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Film', required: true })
  film: Types.ObjectId;

  @Prop({ default: '' })
  episodeSlug: string;

  @Prop({ default: '' })
  serverName: string;

  @Prop({ default: 0 })
  progressSeconds: number;

  @Prop({ default: 0 })
  totalDurationSeconds: number;

  @Prop({ default: Date.now })
  lastWatchedAt: Date;
}

export const HistorySchema = SchemaFactory.createForClass(History);

HistorySchema.index({ user: 1, film: 1 }, { unique: true });
HistorySchema.index({ user: 1, lastWatchedAt: -1 });
