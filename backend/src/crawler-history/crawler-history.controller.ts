import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '../common/constants';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { CrawlerHistoryService } from './crawler-history.service';
import { QueryCrawlerHistoryDto } from './dto/query-crawler-history.dto';

@ApiTags('crawler-history')
@ApiBearerAuth()
@Roles(UserRole.ADMIN)
@RequirePermission('crawler-history:read')
@Controller('crawler-history')
export class CrawlerHistoryController {
  constructor(private readonly crawlerHistoryService: CrawlerHistoryService) {}

  @Get()
  findAll(@Query() query: QueryCrawlerHistoryDto) {
    return this.crawlerHistoryService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.crawlerHistoryService.findOne(id);
  }
}
