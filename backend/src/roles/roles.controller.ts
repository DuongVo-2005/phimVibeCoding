import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '../common/constants';
import { Roles } from '../common/decorators/roles.decorator';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { CreateRoleDto } from './dto/create-role.dto';
import { SetRolePermissionsDto } from './dto/set-role-permissions.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { RolesService } from './roles.service';

@ApiTags('roles')
@ApiBearerAuth()
@Roles(UserRole.ADMIN)
@RequirePermission('roles:manage')
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  findAll() {
    return this.rolesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.rolesService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateRoleDto) {
    return this.rolesService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateRoleDto) {
    return this.rolesService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.rolesService.remove(id);
  }

  @Get(':id/permissions')
  findPermissions(@Param('id') id: string) {
    return this.rolesService.findPermissions(id);
  }

  @Put(':id/permissions')
  setPermissions(@Param('id') id: string, @Body() dto: SetRolePermissionsDto) {
    return this.rolesService.setPermissions(id, dto.permissionIds);
  }

  @Get(':id/users')
  findUsers(@Param('id') id: string, @Query() query: PaginationQueryDto) {
    return this.rolesService.findUsers(id, query);
  }
}
