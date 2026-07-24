import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ActorsModule } from './actors/actors.module';
import { AuthModule } from './auth/auth.module';
import { AvatarsModule } from './avatars/avatars.module';
import { CategoriesModule } from './categories/categories.module';
import { CommentsModule } from './comments/comments.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { PermissionsGuard } from './common/guards/permissions.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { ConfigModule } from './config/config.module';
import { ThrottleConfig } from './config/configuration';
import { CountriesModule } from './countries/countries.module';
import { CrawlerHistoryModule } from './crawler-history/crawler-history.module';
import { CrawlerModule } from './crawler/crawler.module';
import { DatabaseModule } from './database/database.module';
import { DirectorsModule } from './directors/directors.module';
import { FavoritesModule } from './favorites/favorites.module';
import { FilmReportsModule } from './film-reports/film-reports.module';
import { FilmsModule } from './films/films.module';
import { HealthModule } from './health/health.module';
import { HistoriesModule } from './histories/histories.module';
import { PermissionsModule } from './permissions/permissions.module';
import { PlaylistsModule } from './playlists/playlists.module';
import { RatingsModule } from './ratings/ratings.module';
import { RolePermissionsModule } from './role-permissions/role-permissions.module';
import { RolesModule } from './roles/roles.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    ScheduleModule.forRoot(),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const throttleConfig = configService.get<ThrottleConfig>('throttle')!;
        return {
          throttlers: [{ ttl: throttleConfig.ttl * 1000, limit: throttleConfig.limit }],
        };
      },
    }),
    HealthModule,
    AuthModule,
    RolePermissionsModule,
    RolesModule,
    PermissionsModule,
    UsersModule,
    CategoriesModule,
    CountriesModule,
    DirectorsModule,
    ActorsModule,
    FilmsModule,
    CommentsModule,
    RatingsModule,
    FavoritesModule,
    HistoriesModule,
    PlaylistsModule,
    AvatarsModule,
    FilmReportsModule,
    CrawlerModule,
    CrawlerHistoryModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
  ],
})
export class AppModule {}
