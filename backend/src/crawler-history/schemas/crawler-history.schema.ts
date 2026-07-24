import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { CrawlerRunStatus } from '../../common/constants';

export type CrawlerHistoryDocument = CrawlerHistory & Document;

@Schema({ timestamps: { createdAt: true, updatedAt: false }, collection: 'crawler_history' })
export class CrawlerHistory {
  @Prop({ required: true, unique: true })
  runId: string;

  /** Nguồn crawler, vd: 'ophim-films', 'ophim-types' — mở rộng thêm nguồn chỉ cần thêm giá trị mới. */
  @Prop({ required: true, index: true })
  source: string;

  @Prop({ required: true })
  startedAt: Date;

  @Prop({ required: true })
  finishedAt: Date;

  @Prop({ required: true })
  durationMs: number;

  @Prop({ type: String, enum: CrawlerRunStatus, required: true, index: true })
  status: CrawlerRunStatus;

  @Prop({ default: 0 })
  added: number;

  @Prop({ default: 0 })
  updated: number;

  @Prop({ default: 0 })
  failed: number;

  @Prop({ type: String, default: null })
  errorMessage: string | null;

  @Prop({ required: true })
  cronExpression: string;
}

export const CrawlerHistorySchema = SchemaFactory.createForClass(CrawlerHistory);

CrawlerHistorySchema.index({ source: 1, startedAt: -1 });
CrawlerHistorySchema.index({ status: 1, startedAt: -1 });
