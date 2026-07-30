import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '../common/constants';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { DashboardService } from './dashboard.service';
import { QueryDashboardChartsDto } from './dto/query-dashboard-charts.dto';
import { QueryDashboardLimitDto } from './dto/query-dashboard-limit.dto';

@ApiTags('dashboard')
@ApiBearerAuth()
@Roles(UserRole.ADMIN)
@RequirePermission('dashboard:view')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('overview')
  overview() {
    return this.dashboardService.getOverview();
  }

  @Get('charts')
  charts(@Query() query: QueryDashboardChartsDto) {
    return this.dashboardService.getCharts(query.months);
  }

  @Get('top-lists')
  topLists(@Query() query: QueryDashboardLimitDto) {
    return this.dashboardService.getTopLists(query.limit);
  }

  @Get('recent-activity')
  recentActivity(@Query() query: QueryDashboardLimitDto) {
    return this.dashboardService.getRecentActivity(query.limit);
  }
}
