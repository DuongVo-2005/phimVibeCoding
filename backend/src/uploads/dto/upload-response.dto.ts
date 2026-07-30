import { ApiProperty } from '@nestjs/swagger';

/** Khớp `UploadResponseDto{url,filename,mimeType,size}` — api_design.md §24. */
export class UploadResponseDto {
  @ApiProperty({ example: 'http://localhost:3000/uploads/poster/a1b2c3d4.webp' })
  url: string;

  @ApiProperty({ example: 'a1b2c3d4.webp' })
  filename: string;

  @ApiProperty({ example: 'image/webp' })
  mimeType: string;

  @ApiProperty({ example: 123456, description: 'Kích thước file tính bằng byte' })
  size: number;
}
