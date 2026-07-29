import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';

export class QueryCategoryDto {
  // `@Type(() => Boolean)` (cũ) dùng constructor Boolean() ép chuỗi -> luôn `true` cho chuỗi không
  // rỗng (kể cả "false") — bug đã xác nhận thật qua QA (GET /users?isActive=false, cùng pattern,
  // trả kết quả giống hệt isActive=true). Đổi sang cùng pattern @Transform đã đúng ở
  // films/dto/query-film.dto.ts's isPublished.
  @ApiPropertyOptional({
    default: true,
    description: 'Mặc định chỉ trả về danh mục isActive=true nếu không truyền tham số này',
  })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'boolean' ? value : value === 'true'))
  @IsBoolean()
  isActive?: boolean;
}
