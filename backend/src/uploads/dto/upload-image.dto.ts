import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { UploadPurpose } from '../../common/constants';

/**
 * Khớp `api_design.md` §24: `POST /uploads/image` nhận multipart `file` + `purpose`. `file` do
 * `FileInterceptor('file')` xử lý riêng (không khai ở đây — class-validator không áp dụng cho
 * phần binary của multipart body), DTO này chỉ khai field text `purpose` để `ValidationPipe`
 * global (`whitelist: true, forbidNonWhitelisted: true`) validate đúng.
 */
export class UploadImageDto {
  @ApiProperty({ enum: UploadPurpose, example: UploadPurpose.POSTER })
  @IsEnum(UploadPurpose)
  purpose: UploadPurpose;
}
