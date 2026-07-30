import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FilmsModule } from '../films/films.module';
import { EpisodesController } from './episodes.controller';
import { EpisodesService } from './episodes.service';
import { FilmEpisodesController } from './film-episodes.controller';
import { Episode, EpisodeSchema } from './schemas/episode.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Episode.name, schema: EpisodeSchema }]),
    FilmsModule,
  ],
  controllers: [FilmEpisodesController, EpisodesController],
  providers: [EpisodesService],
  exports: [EpisodesService],
})
export class EpisodesModule {}
