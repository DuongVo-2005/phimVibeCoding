import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '../common/constants';
import { Public } from '../common/decorators/public.decorator';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { CountriesService } from './countries.service';
import { CreateCountryDto } from './dto/create-country.dto';
import { UpdateCountryDto } from './dto/update-country.dto';

@ApiTags('countries')
@Controller('countries')
export class CountriesController {
  constructor(private readonly countriesService: CountriesService) {}

  @Public()
  @Get()
  findAll() {
    return this.countriesService.findAll();
  }

  @Public()
  @Get(':slug')
  findBySlug(@Param('slug') slug: string) {
    return this.countriesService.findBySlug(slug);
  }

  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @RequirePermission('countries:create')
  @Post()
  create(@Body() dto: CreateCountryDto) {
    return this.countriesService.create(dto);
  }

  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @RequirePermission('countries:update')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCountryDto) {
    return this.countriesService.update(id, dto);
  }

  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @RequirePermission('countries:delete')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.countriesService.remove(id);
  }
}
