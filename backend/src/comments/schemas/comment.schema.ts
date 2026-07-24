import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CommentDocument = Comment & Document;

@Schema({ timestamps: true, collection: 'comments' })
export class Comment {
  @Prop({ type: Types.ObjectId, ref: 'Film', required: true })
  film: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({ required: true, trim: true })
  content: string;

  @Prop({ type: Types.ObjectId, ref: 'Comment', default: null })
  parent: Types.ObjectId | null;

  @Prop({ default: 0 })
  upVoteCount: number;

  @Prop({ default: 0 })
  downVoteCount: number;
}

export const CommentSchema = SchemaFactory.createForClass(Comment);

CommentSchema.index({ film: 1, createdAt: -1 });
CommentSchema.index({ film: 1, upVoteCount: -1 });
CommentSchema.index({ createdAt: -1 });
CommentSchema.index({ parent: 1 });
