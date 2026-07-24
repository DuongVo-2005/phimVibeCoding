import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { UpdateHistoryDto } from './dto/update-history.dto';
import { HistoriesService } from './histories.service';

@ApiBearerAuth()
@ApiTags('histories')
@Controller('histories')
export class HistoriesController {
  constructor(private readonly historiesService: HistoriesService) {}

  @Post()
  upsertProgress(@CurrentUser('userId') userId: string, @Body() dto: UpdateHistoryDto) {
    return this.historiesService.upsertProgress(userId, dto);
  }

  @Get('recent')
  findRecent(@CurrentUser('userId') userId: string, @Query() query: PaginationQueryDto) {
    return this.historiesService.findRecent(userId, query);
  }

  @Get('film/:filmId')
  findByFilm(@CurrentUser('userId') userId: string, @Param('filmId') filmId: string) {
    return this.historiesService.findByFilm(userId, filmId);
  }

  @Delete(':filmId')
  remove(@CurrentUser('userId') userId: string, @Param('filmId') filmId: string) {
    return this.historiesService.remove(userId, filmId);
  }
}
