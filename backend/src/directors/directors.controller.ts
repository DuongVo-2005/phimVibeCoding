import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '../common/constants';
import { Public } from '../common/decorators/public.decorator';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { DirectorsService } from './directors.service';
import { CreateDirectorDto } from './dto/create-director.dto';
import { QueryDirectorDto } from './dto/query-director.dto';
import { UpdateDirectorDto } from './dto/update-director.dto';

@ApiTags('directors')
@Controller('directors')
export class DirectorsController {
  constructor(private readonly directorsService: DirectorsService) {}

  @Public()
  @Get()
  findAll(@Query() query: QueryDirectorDto) {
    return this.directorsService.findAll(query);
  }

  @Public()
  @Get(':slug')
  findBySlug(@Param('slug') slug: string) {
    return this.directorsService.findBySlug(slug);
  }

  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @RequirePermission('directors:create')
  @Post()
  create(@Body() dto: CreateDirectorDto) {
    return this.directorsService.create(dto);
  }

  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @RequirePermission('directors:update')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateDirectorDto) {
    return this.directorsService.update(id, dto);
  }

  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @RequirePermission('directors:delete')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.directorsService.remove(id);
  }
}
