import { Body, Controller, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '../common/constants';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { CrawlerService } from './crawler.service';
import { SyncFilmDetailDto } from './dto/sync-film-detail.dto';

@ApiTags('crawler')
@ApiBearerAuth()
@Roles(UserRole.ADMIN)
@Controller('crawler')
export class CrawlerController {
  constructor(private readonly crawlerService: CrawlerService) {}

  // crawler:run gate riêng cho trigger hàng loạt (bulk), khác crawler:sync ở 2 route bên dưới —
  // đúng theo api_design.md §20.
  @RequirePermission('crawler:run')
  @Post('sync/films')
  syncFilmList(@Query('pages') pages?: number) {
    return this.crawlerService.syncFilmList(pages ? Number(pages) : undefined);
  }

  @RequirePermission('crawler:sync')
  @Post('sync/film')
  syncFilmDetail(@Body() dto: SyncFilmDetailDto) {
    return this.crawlerService.syncFilmDetail(dto.slug);
  }

  @RequirePermission('crawler:sync')
  @Post('sync/types')
  syncTypes() {
    return this.crawlerService.syncTypes();
  }
}
