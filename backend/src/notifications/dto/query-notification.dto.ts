import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class QueryNotificationDto extends PaginationQueryDto {
  // `@Transform` ép chuỗi query string đúng cách (không dùng `@Type(()=>Boolean)` — bug đã xác
  // nhận ở `QueryUserDto.isActive`: `Boolean("false")` luôn `true`).
  @ApiPropertyOptional({ description: 'Lọc theo trạng thái đã đọc' })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'boolean' ? value : value === 'true'))
  @IsBoolean()
  isRead?: boolean;
}
