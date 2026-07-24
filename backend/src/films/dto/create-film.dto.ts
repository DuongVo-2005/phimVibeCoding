import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type as TransformType } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { FilmCategory, FilmStatus } from '../../common/constants';
import { EpisodeServerDto } from './episode.dto';

export class CreateFilmDto {
  @ApiProperty({ example: 'Người Nhện: Không Còn Nhà' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ example: 'Spider-Man: No Way Home' })
  @IsOptional()
  @IsString()
  originalTitle?: string;

  @ApiPropertyOptional({ example: 'Peter Parker phải đối mặt với đa vũ trụ...' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'https://example.com/poster.jpg' })
  @IsOptional()
  @IsString()
  posterUrl?: string;

  @ApiPropertyOptional({ example: 'https://example.com/thumb.jpg' })
  @IsOptional()
  @IsString()
  thumbUrl?: string;

  @ApiPropertyOptional({ example: 'https://example.com/trailer.mp4' })
  @IsOptional()
  @IsString()
  trailerUrl?: string;

  @ApiPropertyOptional({ enum: FilmCategory, example: FilmCategory.SINGLE })
  @IsOptional()
  @IsEnum(FilmCategory)
  category?: FilmCategory;

  @ApiPropertyOptional({ example: 'Full' })
  @IsOptional()
  @IsString()
  episodeCurrent?: string;

  @ApiPropertyOptional({ example: '1' })
  @IsOptional()
  @IsString()
  episodeTotal?: string;

  @ApiPropertyOptional({ example: '148 phút' })
  @IsOptional()
  @IsString()
  duration?: string;

  @ApiPropertyOptional({ example: 'FHD' })
  @IsOptional()
  @IsString()
  quality?: string;

  @ApiPropertyOptional({ example: 'Vietsub' })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiPropertyOptional({ example: 2021 })
  @IsOptional()
  @IsNumber()
  releaseYear?: number;

  @ApiPropertyOptional({ type: [String], example: ['65f1a2b3c4d5e6f7a8b9c0d3'] })
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  countries?: string[];

  @ApiPropertyOptional({ type: [String], example: ['65f1a2b3c4d5e6f7a8b9c0d4'] })
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  directors?: string[];

  @ApiPropertyOptional({ type: [String], example: ['65f1a2b3c4d5e6f7a8b9c0d1'] })
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  actors?: string[];

  @ApiPropertyOptional({ type: [String], example: ['65f1a2b3c4d5e6f7a8b9c0d2'] })
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  categories?: string[];

  @ApiPropertyOptional({ type: [EpisodeServerDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @TransformType(() => EpisodeServerDto)
  episodes?: EpisodeServerDto[];

  @ApiPropertyOptional({ enum: FilmStatus, example: FilmStatus.COMPLETED })
  @IsOptional()
  @IsEnum(FilmStatus)
  status?: FilmStatus;

  @ApiPropertyOptional({
    default: true,
    description: 'Ẩn/hiện phim trên các API công khai (mặc định true khi tạo mới)',
  })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'boolean' ? value : value === 'true'))
  @IsBoolean()
  isPublished?: boolean;
}
