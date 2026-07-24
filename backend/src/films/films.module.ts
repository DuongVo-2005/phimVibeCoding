import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Film, FilmSchema } from './schemas/film.schema';
import { FilmsController } from './films.controller';
import { FilmsService } from './films.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: Film.name, schema: FilmSchema }])],
  controllers: [FilmsController],
  providers: [FilmsService],
  exports: [FilmsService],
})
export class FilmsModule {}
