import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString } from 'class-validator';

export class CreateDirectorDto {
  @ApiProperty({ example: 'Vương Gia Vệ' })
  @IsString()
  name: string;

  @ApiProperty({ required: false, example: 'https://example.com/avatar.jpg' })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiProperty({ required: false, example: 'Đạo diễn nổi tiếng người Hồng Kông' })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiProperty({ required: false, example: '1958-07-17' })
  @IsOptional()
  @IsDateString()
  birthday?: string;

  @ApiProperty({ required: false, example: 'Hồng Kông' })
  @IsOptional()
  @IsString()
  nationality?: string;
}
