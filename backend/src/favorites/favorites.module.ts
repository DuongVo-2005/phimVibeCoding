import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Actor, ActorSchema } from '../actors/schemas/actor.schema';
import { Film, FilmSchema } from '../films/schemas/film.schema';
import { FavoritesController } from './favorites.controller';
import { FavoritesService } from './favorites.service';
import { Favorite, FavoriteSchema } from './schemas/favorite.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Favorite.name, schema: FavoriteSchema },
      { name: Film.name, schema: FilmSchema },
      { name: Actor.name, schema: ActorSchema },
    ]),
  ],
  controllers: [FavoritesController],
  providers: [FavoritesService],
  exports: [FavoritesService],
})
export class FavoritesModule {}
