import { Body, Controller, Delete, Param, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '../common/constants';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { UpdateEpisodeDto } from './dto/update-episode.dto';
import { UpdateEpisodeOrderDto } from './dto/update-episode-order.dto';
import { EpisodesService } from './episodes.service';

@ApiBearerAuth()
@ApiTags('episodes')
@Roles(UserRole.ADMIN)
@RequirePermission('films:update')
@Controller('episodes')
export class EpisodesController {
  constructor(private readonly episodesService: EpisodesService) {}

  // Khai báo TRƯỚC ':id' — dù không thực sự collide (':id/order' có 2 segment, ':id' (DELETE) chỉ
  // 1) vẫn giữ thói quen route cụ thể trước route tổng quát cho rõ ràng.
  @Patch(':id/order')
  updateOrder(@Param('id') id: string, @Body() dto: UpdateEpisodeOrderDto) {
    return this.episodesService.updateOrder(id, dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateEpisodeDto) {
    return this.episodesService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.episodesService.remove(id);
  }
}
