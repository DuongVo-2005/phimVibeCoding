import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { FavoriteTargetType } from '../common/constants';
import { CreateFavoriteDto } from './dto/create-favorite.dto';
import { QueryFavoriteDto } from './dto/query-favorite.dto';
import { FavoritesService } from './favorites.service';

@ApiBearerAuth()
@ApiTags('favorites')
@Controller('favorites')
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Post()
  add(@Body() dto: CreateFavoriteDto, @CurrentUser('userId') userId: string) {
    return this.favoritesService.add(userId, dto);
  }

  @Delete(':targetType/:targetId')
  remove(
    @Param('targetType') targetType: FavoriteTargetType,
    @Param('targetId') targetId: string,
    @CurrentUser('userId') userId: string,
  ) {
    return this.favoritesService.remove(userId, targetType, targetId);
  }

  @Get()
  findMine(@Query() query: QueryFavoriteDto, @CurrentUser('userId') userId: string) {
    return this.favoritesService.findMine(userId, query.targetType, query);
  }
}
