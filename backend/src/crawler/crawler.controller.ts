import { Body, Controller, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '../common/constants';
import { Roles } from '../common/decorators/roles.decorator';
import { CrawlerService } from './crawler.service';
import { SyncFilmDetailDto } from './dto/sync-film-detail.dto';

@ApiTags('crawler')
@ApiBearerAuth()
@Roles(UserRole.ADMIN)
@Controller('crawler')
export class CrawlerController {
  constructor(private readonly crawlerService: CrawlerService) {}

  @Post('sync/films')
  syncFilmList(@Query('pages') pages?: number) {
    return this.crawlerService.syncFilmList(pages ? Number(pages) : undefined);
  }

  @Post('sync/film')
  syncFilmDetail(@Body() dto: SyncFilmDetailDto) {
    return this.crawlerService.syncFilmDetail(dto.slug);
  }

  @Post('sync/types')
  syncTypes() {
    return this.crawlerService.syncTypes();
  }
}
