import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateRatingDto } from './dto/create-rating.dto';
import { RatingsService } from './ratings.service';

@ApiTags('ratings')
@Controller('ratings')
export class RatingsController {
  constructor(private readonly ratingsService: RatingsService) {}

  @Public()
  @Get('film/:filmId')
  getFilmRatingSummary(@Param('filmId') filmId: string) {
    return this.ratingsService.getFilmRatingSummary(filmId);
  }

  @ApiBearerAuth()
  @Get('film/:filmId/me')
  getMyRating(@Param('filmId') filmId: string, @CurrentUser('userId') userId: string) {
    return this.ratingsService.getMyRating(userId, filmId);
  }

  @ApiBearerAuth()
  @Post(':filmId')
  upsertRating(
    @Param('filmId') filmId: string,
    @Body() dto: CreateRatingDto,
    @CurrentUser('userId') userId: string,
  ) {
    return this.ratingsService.upsertRating(userId, filmId, dto);
  }

  @ApiBearerAuth()
  @Delete(':filmId')
  removeRating(@Param('filmId') filmId: string, @CurrentUser('userId') userId: string) {
    return this.ratingsService.removeRating(userId, filmId);
  }
}
