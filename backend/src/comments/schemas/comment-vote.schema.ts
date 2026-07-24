import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { VoteType } from '../../common/constants';

export type CommentVoteDocument = CommentVote & Document;

@Schema({ timestamps: true, collection: 'comment_votes' })
export class CommentVote {
  @Prop({ type: Types.ObjectId, ref: 'Comment', required: true })
  comment: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({ type: String, enum: VoteType, required: true })
  voteType: VoteType;
}

export const CommentVoteSchema = SchemaFactory.createForClass(CommentVote);

CommentVoteSchema.index({ comment: 1, user: 1 }, { unique: true });
