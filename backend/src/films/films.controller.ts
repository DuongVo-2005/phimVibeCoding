import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';
import { UserRole } from '../common/constants';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { OptionalJwtAuthGuard } from '../common/guards/optional-jwt-auth.guard';
import { CreateFilmDto } from './dto/create-film.dto';
import { QueryFilmDto } from './dto/query-film.dto';
import { UpdateFilmDto } from './dto/update-film.dto';
import { FILM_TOP_METRICS, FilmTopMetric } from './films.service';
import { FilmsService } from './films.service';

@ApiTags('films')
@Controller('films')
export class FilmsController {
  constructor(private readonly filmsService: FilmsService) {}

  // @Public() + OptionalJwtAuthGuard: route vẫn công khai cho người ẩn danh, nhưng nếu caller gửi
  // kèm Bearer token hợp lệ của Admin thì được phép dùng tham số isPublished (xem business rule
  // api_design.md §6 — "Public callers can never override the implicit isPublished:true filter").
  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @Get()
  findAll(@Query() query: QueryFilmDto, @CurrentUser() user?: AuthenticatedUser) {
    const isAdmin = user?.role === UserRole.ADMIN;
    if (query.isPublished !== undefined && !isAdmin) {
      throw new BadRequestException('Tham số isPublished chỉ dành cho Admin');
    }
    return this.filmsService.findAll(query, isAdmin);
  }

  @Public()
  @Get('top')
  findTop(@Query('limit') limit?: number, @Query('metric') metric?: string) {
    const resolvedMetric: FilmTopMetric = (
      FILM_TOP_METRICS as readonly string[]
    ).includes(metric ?? '')
      ? (metric as FilmTopMetric)
      : 'view';
    return this.filmsService.findTop(limit ? Number(limit) : undefined, resolvedMetric);
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

  // Route literal — phải khai báo TRƯỚC :slug để tránh bị :slug "nuốt" mất (cùng hazard đã gặp ở
  // CategoriesController với route sync/history).
  @Public()
  @Get('most-commented')
  findMostCommented(@Query('limit') limit?: number) {
    return this.filmsService.findMostCommented(limit ? Number(limit) : undefined);
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
  @RequirePermission('films:create')
  @Post()
  create(@Body() dto: CreateFilmDto) {
    return this.filmsService.create(dto);
  }

  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @RequirePermission('films:update')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateFilmDto) {
    return this.filmsService.update(id, dto);
  }

  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @RequirePermission('films:delete')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.filmsService.remove(id);
  }
}
