import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '../common/constants';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { CreateFilmDto } from './dto/create-film.dto';
import { QueryFilmDto } from './dto/query-film.dto';
import { UpdateFilmDto } from './dto/update-film.dto';
import { FilmsService } from './films.service';

@ApiTags('films')
@Controller('films')
export class FilmsController {
  constructor(private readonly filmsService: FilmsService) {}

  @Public()
  @Get()
  findAll(@Query() query: QueryFilmDto) {
    return this.filmsService.findAll(query);
  }

  @Public()
  @Get('top')
  findTop(@Query('limit') limit?: number) {
    return this.filmsService.findTop(limit ? Number(limit) : undefined);
  }

  @Public()
  @Get('hot')
  findHot(@Query('limit') limit?: number) {
    return this.filmsService.findHot(limit ? Number(limit) : undefined);
  }

  @Public()
  @Get('latest-series')
  findLatestSeries(@Query('limit') limit?: number) {
    return this.filmsService.findLatestSeries(limit ? Number(limit) : undefined);
  }

  @Public()
  @Get(':slug')
  findBySlug(@Param('slug') slug: string) {
    return this.filmsService.findBySlug(slug);
  }

  @Public()
  @Get(':slug/related')
  findRelated(@Param('slug') slug: string, @Query('limit') limit?: number) {
    return this.filmsService.findRelated(slug, limit ? Number(limit) : undefined);
  }

  @Public()
  @Post(':slug/view')
  incrementView(@Param('slug') slug: string) {
    return this.filmsService.incrementView(slug);
  }

  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @Post()
  create(@Body() dto: CreateFilmDto) {
    return this.filmsService.create(dto);
  }

  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateFilmDto) {
    return this.filmsService.update(id, dto);
  }

  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.filmsService.remove(id);
  }
}
