import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '../common/constants';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { CreateEpisodeDto } from './dto/create-episode.dto';
import { EpisodesService } from './episodes.service';

/** Route literal `/films/:filmId/episodes` theo đúng yêu cầu Phase 35 (khác `EpisodesController`
 * bên dưới, base `/episodes`) — 2 controller riêng cùng dùng `EpisodesService`, mỗi controller giữ
 * 1 base path có tên rõ ràng (đúng convention toàn dự án: KHÔNG dùng `@Controller()` rỗng + path
 * đầy đủ từng route). */
@ApiBearerAuth()
@ApiTags('episodes')
@Roles(UserRole.ADMIN)
@RequirePermission('films:update')
@Controller('films/:filmId/episodes')
export class FilmEpisodesController {
  constructor(private readonly episodesService: EpisodesService) {}

  @Get()
  findByFilm(@Param('filmId') filmId: string) {
    return this.episodesService.findByFilm(filmId);
  }

  @Post()
  create(@Param('filmId') filmId: string, @Body() dto: CreateEpisodeDto) {
    return this.episodesService.create(filmId, dto);
  }
}
