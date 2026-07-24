import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { FilmReportStatus } from '../../common/constants';

export type FilmReportDocument = FilmReport & Document;

@Schema({ timestamps: { createdAt: true, updatedAt: false }, collection: 'film_reports' })
export class FilmReport {
  @Prop({ type: Types.ObjectId, ref: 'Film', required: true })
  film: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  user: Types.ObjectId | null;

  @Prop({ required: true, trim: true })
  reason: string;

  @Prop({ type: String, enum: FilmReportStatus, default: FilmReportStatus.PENDING })
  status: FilmReportStatus;
}

export const FilmReportSchema = SchemaFactory.createForClass(FilmReport);

FilmReportSchema.index({ status: 1, createdAt: -1 });
FilmReportSchema.index({ film: 1 });
