import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString } from 'class-validator';

export class CreateActorDto {
  @ApiProperty({ example: 'Tom Holland' })
  @IsString()
  name: string;

  @ApiProperty({ required: false, example: 'https://example.com/avatar.jpg' })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiProperty({ required: false, example: 'Diễn viên người Anh, nổi tiếng với vai Spider-Man' })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiProperty({ required: false, example: '1996-06-01' })
  @IsOptional()
  @IsDateString()
  birthday?: string;

  @ApiProperty({ required: false, example: 'Anh' })
  @IsOptional()
  @IsString()
  nationality?: string;
}
