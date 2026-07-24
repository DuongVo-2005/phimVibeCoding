import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FilmsModule } from '../films/films.module';
import { RatingsController } from './ratings.controller';
import { RatingsService } from './ratings.service';
import { Rating, RatingSchema } from './schemas/rating.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Rating.name, schema: RatingSchema }]),
    FilmsModule,
  ],
  controllers: [RatingsController],
  providers: [RatingsService],
  exports: [RatingsService],
})
export class RatingsModule {}
