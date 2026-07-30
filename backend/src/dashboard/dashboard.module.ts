import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Actor, ActorSchema } from '../actors/schemas/actor.schema';
import { Category, CategorySchema } from '../categories/schemas/category.schema';
import { Comment, CommentSchema } from '../comments/schemas/comment.schema';
import { Country, CountrySchema } from '../countries/schemas/country.schema';
import { Director, DirectorSchema } from '../directors/schemas/director.schema';
import { Favorite, FavoriteSchema } from '../favorites/schemas/favorite.schema';
import { FilmsModule } from '../films/films.module';
import { Film, FilmSchema } from '../films/schemas/film.schema';
import { Playlist, PlaylistSchema } from '../playlists/schemas/playlist.schema';
import { Rating, RatingSchema } from '../ratings/schemas/rating.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

/** Đọc-only, tổng hợp qua aggregation trên các collection đã tồn tại — không có collection/model
 * mới nào (đúng định hướng `implementation_roadmap.md` Phase 10: "reads users, films, comments...
 * via aggregation only"). Import `FilmsModule` (thay vì tự viết lại) để tái dùng
 * `FilmsService.findTop()` cho top-lists theo view/rating — tránh trùng lặp logic sort/filter
 * `isPublished` đã có sẵn. */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Film.name, schema: FilmSchema },
      { name: Category.name, schema: CategorySchema },
      { name: Country.name, schema: CountrySchema },
      { name: Actor.name, schema: ActorSchema },
      { name: Director.name, schema: DirectorSchema },
      { name: Comment.name, schema: CommentSchema },
      { name: Rating.name, schema: RatingSchema },
      { name: Favorite.name, schema: FavoriteSchema },
      { name: Playlist.name, schema: PlaylistSchema },
    ]),
    FilmsModule,
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
