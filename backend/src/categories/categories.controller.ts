import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '../common/constants';
import { Public } from '../common/decorators/public.decorator';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { CrawlerHistoryService } from '../crawler-history/crawler-history.service';
import { QueryCrawlerHistoryDto } from '../crawler-history/dto/query-crawler-history.dto';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { QueryCategoryDto } from './dto/query-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { OphimCategorySyncService } from './ophim-category-sync.service';

const CATEGORIES_SYNC_SOURCE = 'ophim-categories';

@ApiTags('categories')
@Controller('categories')
export class CategoriesController {
  constructor(
    private readonly categoriesService: CategoriesService,
    private readonly ophimCategorySyncService: OphimCategorySyncService,
    private readonly crawlerHistoryService: CrawlerHistoryService,
  ) {}

  @Public()
  @Get()
  findAll(@Query() query: QueryCategoryDto) {
    return this.categoriesService.findAll(query);
  }

  @Public()
  @Get('hot')
  findHot() {
    return this.categoriesService.findHot();
  }

  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @RequirePermission('categories:sync')
  @Get('sync/history')
  findSyncHistory(@Query() query: QueryCrawlerHistoryDto) {
    // Gán trực tiếp lên instance (thay vì spread ra object literal) để giữ nguyên getter `skip`
    // kế thừa từ PaginationQueryDto — spread chỉ copy own-enumerable properties, không có getter.
    query.source = CATEGORIES_SYNC_SOURCE;
    return this.crawlerHistoryService.findAll(query);
  }

  @Public()
  @Get(':slug')
  findBySlug(@Param('slug') slug: string) {
    return this.categoriesService.findBySlug(slug);
  }

  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @RequirePermission('categories:create')
  @Post()
  create(@Body() dto: CreateCategoryDto) {
    return this.categoriesService.create(dto);
  }

  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @RequirePermission('categories:sync')
  @Post('sync')
  syncAll() {
    return this.ophimCategorySyncService.syncAll();
  }

  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @RequirePermission('categories:sync')
  @Post('sync/:slug')
  syncOne(@Param('slug') slug: string) {
    return this.ophimCategorySyncService.syncOne(slug);
  }

  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @RequirePermission('categories:update')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.categoriesService.update(id, dto);
  }

  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @RequirePermission('categories:delete')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.categoriesService.remove(id);
  }
}
