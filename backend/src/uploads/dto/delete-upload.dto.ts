import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

/** Khớp `DeleteUploadDto{url}` — api_design.md §24. `url` là URL tuyệt đối do chính
 * `POST /uploads/image` trả về trước đó — `UploadsService.remove()` tự validate URL này thuộc
 * đúng gốc `${PUBLIC_BASE_URL}/uploads/...` của server trước khi map ngược lại thành đường dẫn
 * file thật (chặn path traversal / xoá file ngoài ý muốn — xem ghi chú tại `uploads.service.ts`). */
export class DeleteUploadDto {
  @ApiProperty({ example: 'http://localhost:3000/uploads/poster/a1b2c3d4.webp' })
  @IsString()
  @IsNotEmpty()
  url: string;
}
