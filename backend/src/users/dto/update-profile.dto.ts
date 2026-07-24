import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsMongoId, IsOptional, IsString, MaxLength } from 'class-validator';
import { Gender } from '../../common/constants';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'Nguyen Van A' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ enum: Gender, example: Gender.MALE })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiPropertyOptional({ description: 'ImgAvatar id', example: '65f1a2b3c4d5e6f7a8b9c0d1' })
  @IsOptional()
  @IsMongoId()
  avatar?: string;
}
