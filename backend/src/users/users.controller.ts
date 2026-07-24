import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '../common/constants';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';
import { CreateUserByAdminDto } from './dto/create-user-by-admin.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { SetUserRolesDto } from './dto/set-user-roles.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async me(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.findById(user.userId);
  }

  @Patch('me')
  async updateProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(user.userId, dto);
  }

  @Patch('me/password')
  async updatePassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdatePasswordDto,
  ) {
    await this.usersService.updatePassword(user.userId, dto);
    return { message: 'Đổi mật khẩu thành công' };
  }

  @Roles(UserRole.ADMIN)
  @RequirePermission('users:manage')
  @Post()
  create(@Body() dto: CreateUserByAdminDto) {
    return this.usersService.createByAdmin(dto);
  }

  @Roles(UserRole.ADMIN)
  @RequirePermission('users:read')
  @Get()
  findAll(@Query() query: QueryUserDto) {
    return this.usersService.findAll(query);
  }

  @Roles(UserRole.ADMIN)
  @RequirePermission('users:read')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOneOrThrow(id);
  }

  @Roles(UserRole.ADMIN)
  @RequirePermission('users:manage')
  @Patch(':id/role')
  updateRole(
    @CurrentUser('userId') actingUserId: string,
    @Param('id') id: string,
    @Body() dto: UpdateUserRoleDto,
  ) {
    return this.usersService.updateRole(actingUserId, id, dto);
  }

  @Roles(UserRole.ADMIN)
  @RequirePermission('users:manage')
  @Patch(':id/status')
  updateStatus(
    @CurrentUser('userId') actingUserId: string,
    @Param('id') id: string,
    @Body() dto: UpdateUserStatusDto,
  ) {
    return this.usersService.updateStatus(actingUserId, id, dto);
  }

  @Roles(UserRole.ADMIN)
  @RequirePermission('users:manage')
  @Delete(':id')
  remove(@CurrentUser('userId') actingUserId: string, @Param('id') id: string) {
    return this.usersService.remove(actingUserId, id);
  }

  @Roles(UserRole.ADMIN)
  @RequirePermission('users:manage')
  @Get(':id/roles')
  findRoles(@Param('id') id: string) {
    return this.usersService.findRoles(id);
  }

  @Roles(UserRole.ADMIN)
  @RequirePermission('users:manage')
  @Put(':id/roles')
  setRoles(
    @CurrentUser('userId') actingUserId: string,
    @Param('id') id: string,
    @Body() dto: SetUserRolesDto,
  ) {
    return this.usersService.setRoles(actingUserId, id, dto);
  }

  @Roles(UserRole.ADMIN)
  @RequirePermission('users:manage')
  @Delete(':id/roles/:roleId')
  removeRole(
    @CurrentUser('userId') actingUserId: string,
    @Param('id') id: string,
    @Param('roleId') roleId: string,
  ) {
    return this.usersService.removeRole(actingUserId, id, roleId);
  }
}
