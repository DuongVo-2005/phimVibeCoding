import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PlaylistDocument = Playlist & Document;

@Schema({ timestamps: true, collection: 'playlists' })
export class Playlist {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ type: [Types.ObjectId], ref: 'Film', default: [] })
  films: Types.ObjectId[];
}

export const PlaylistSchema = SchemaFactory.createForClass(Playlist);

PlaylistSchema.index({ user: 1 });
