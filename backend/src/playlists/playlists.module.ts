import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Playlist, PlaylistSchema } from './schemas/playlist.schema';
import { PlaylistsController } from './playlists.controller';
import { PlaylistsService } from './playlists.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: Playlist.name, schema: PlaylistSchema }])],
  controllers: [PlaylistsController],
  providers: [PlaylistsService],
  exports: [PlaylistsService],
})
export class PlaylistsModule {}
