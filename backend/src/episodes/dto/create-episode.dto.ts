import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, IsUrl, Min } from 'class-validator';

/** Chuỗi rỗng -> `undefined` TRƯỚC khi validate — `@IsOptional()` chỉ bỏ qua validate khi giá trị
 * là `undefined`/`null`, KHÔNG bỏ qua chuỗi rỗng `''` (form gửi field URL chưa điền dưới dạng
 * `''`, không phải thiếu hẳn field) — nếu không transform trước, `@IsUrl()` sẽ từ chối `''` như một
 * URL không hợp lệ dù về mặt UX đây là "chưa nhập", không phải "nhập sai". */
function emptyStringToUndefined({ value }: { value: unknown }) {
  return typeof value === 'string' && value.trim() === '' ? undefined : value;
}

export class CreateEpisodeDto {
  @ApiProperty({ example: 1, minimum: 1 })
  @IsInt()
  @Min(1)
  episodeNumber: number;

  @ApiProperty({ example: 'Tập 1' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ example: 'https://example.com/embed/tap-1' })
  @IsOptional()
  @Transform(emptyStringToUndefined)
  @IsUrl({ require_protocol: true }, { message: 'embedUrl không hợp lệ' })
  embedUrl?: string;

  @ApiPropertyOptional({ example: 'https://example.com/m3u8/tap-1.m3u8' })
  @IsOptional()
  @Transform(emptyStringToUndefined)
  @IsUrl({ require_protocol: true }, { message: 'm3u8Url không hợp lệ' })
  m3u8Url?: string;

  @ApiPropertyOptional({ example: 'https://example.com/subtitle/tap-1.vtt' })
  @IsOptional()
  @Transform(emptyStringToUndefined)
  @IsUrl({ require_protocol: true }, { message: 'subtitleUrl không hợp lệ' })
  subtitleUrl?: string;

  @ApiPropertyOptional({ example: '45 phút' })
  @IsOptional()
  @IsString()
  duration?: string;

  // `displayOrder` KHÔNG có ở đây — luôn server-tính (append cuối danh sách khi tạo), chỉ đổi được
  // qua PATCH /episodes/:id/order (xem ghi chú EpisodeSchema.displayOrder).
  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'boolean' ? value : value === 'true'))
  @IsBoolean()
  isPublished?: boolean;
}
