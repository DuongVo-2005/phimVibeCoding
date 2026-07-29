import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { UserRole } from '../../common/constants';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class QueryUserDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Tìm theo tên hoặc email' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: UserRole })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  // `@Type(() => Boolean)` (cũ) dùng constructor Boolean() ép chuỗi -> luôn `true` cho chuỗi không
  // rỗng (kể cả "false") — bug đã xác nhận thật qua QA (GET /users?isActive=false trả kết quả
  // giống hệt isActive=true). Đổi sang cùng pattern @Transform đã đúng ở
  // films/dto/query-film.dto.ts's isPublished.
  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'boolean' ? value : value === 'true'))
  @IsBoolean()
  isActive?: boolean;
}
