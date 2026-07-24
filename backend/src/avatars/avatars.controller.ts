import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/constants';
import { AvatarsService } from './avatars.service';
import { CreateImgAvatarDto } from './dto/create-img-avatar.dto';
import { CreateTypeAvatarDto } from './dto/create-type-avatar.dto';

@ApiTags('avatars')
@Controller('avatars')
export class AvatarsController {
  constructor(private readonly avatarsService: AvatarsService) {}

  @Public()
  @Get('types')
  findAllTypes() {
    return this.avatarsService.findAllTypes();
  }

  @Public()
  @Get('images')
  findImages(@Query('typeId') typeId?: string) {
    return this.avatarsService.findImages(typeId);
  }

  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @Post('types')
  createType(@Body() dto: CreateTypeAvatarDto) {
    return this.avatarsService.createType(dto);
  }

  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @Post('images')
  createImage(@Body() dto: CreateImgAvatarDto) {
    return this.avatarsService.createImage(dto);
  }

  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @Delete('types/:id')
  removeType(@Param('id') id: string) {
    return this.avatarsService.removeType(id);
  }

  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @Delete('images/:id')
  removeImage(@Param('id') id: string) {
    return this.avatarsService.removeImage(id);
  }
}
