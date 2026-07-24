import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { FilmCategory, FilmStatus } from '../../common/constants';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class QueryFilmDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Slug thể loại (danh mục) — thay thế `type`' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({
    description:
      'DEPRECATED — dùng `category` thay thế. Giữ lại để tương thích ngược, cùng ý nghĩa (slug thể loại).',
    deprecated: true,
  })
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

  @ApiPropertyOptional({
    enum: FilmCategory,
    description: 'Định dạng phim lẻ/phim bộ — trước đây là tham số `category` (đã đổi tên)',
  })
  @IsOptional()
  @IsEnum(FilmCategory)
  format?: FilmCategory;

  @ApiPropertyOptional({ enum: FilmStatus })
  @IsOptional()
  @IsEnum(FilmStatus)
  status?: FilmStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  year?: string;

  @ApiPropertyOptional({
    description:
      'Chỉ Admin mới dùng được — bỏ qua bộ lọc isPublished:true mặc định, hoặc lọc riêng phim ẩn (isPublished=false). Người dùng thường truyền vào sẽ bị từ chối (400).',
  })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'boolean' ? value : value === 'true'))
  @IsBoolean()
  isPublished?: boolean;
}
