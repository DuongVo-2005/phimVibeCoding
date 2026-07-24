import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { FilmCategory, FilmStatus } from '../../common/constants';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class QueryFilmDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Slug thể loại' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ description: 'Slug quốc gia' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ description: 'Slug đạo diễn' })
  @IsOptional()
  @IsString()
  director?: string;

  @ApiPropertyOptional({ enum: FilmCategory })
  @IsOptional()
  @IsEnum(FilmCategory)
  category?: FilmCategory;

  @ApiPropertyOptional({ enum: FilmStatus })
  @IsOptional()
  @IsEnum(FilmStatus)
  status?: FilmStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  year?: string;
}
