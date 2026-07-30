import { Body, Controller, Delete, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '../common/constants';
import { Roles } from '../common/decorators/roles.decorator';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { DeleteUploadDto } from './dto/delete-upload.dto';
import { UploadImageDto } from './dto/upload-image.dto';
import { UploadResponseDto } from './dto/upload-response.dto';
import { UPLOAD_MULTER_SAFETY_LIMIT_BYTES, UploadsService } from './uploads.service';

/**
 * UploadsController — Phase 31 (v1.1). Khớp `api_design.md` §24.
 *
 * `FileInterceptor('file', { storage: memoryStorage(), limits: { fileSize: ...SAFETY_LIMIT } })`:
 * dùng `memoryStorage` (không phải `diskStorage`) — file KHÔNG được ghi xuống đĩa cho tới khi
 * `UploadsService.save()` tự validate xong mimetype + dung lượng THEO ĐÚNG CHÍNH SÁCH (5MB, xem
 * `uploads.service.ts`) và ném `BadRequestException` (chuẩn 400 qua `HttpExceptionFilter` có
 * sẵn) nếu vi phạm — không có file "rác" nào bị ghi ra đĩa rồi mới xoá. `limits.fileSize` ở tầng
 * Multer chỉ là TRẦN AN TOÀN (10MB, gấp đôi chính sách) chặn lạm dụng cực đoan (endpoint yêu cầu
 * `uploads:create`, chỉ admin đã xác thực mới gọi được) — vượt trần này mới rơi vào lỗi Multer thô
 * (500 qua catch-all filter), chấp nhận được vì đây là hành vi cố tình vượt XA chính sách bình
 * thường, không phải trường hợp "file hơi lớn" mà roadmap yêu cầu phải trả 400 rõ ràng.
 */
@ApiTags('uploads')
@ApiBearerAuth()
@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Roles(UserRole.ADMIN)
  @RequirePermission('uploads:create')
  @Post('image')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: UPLOAD_MULTER_SAFETY_LIMIT_BYTES },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        purpose: { type: 'string', enum: ['poster', 'thumbnail', 'avatar'] },
      },
      required: ['file', 'purpose'],
    },
  })
  @ApiResponse({ status: 201, type: UploadResponseDto })
  uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadImageDto,
  ): Promise<UploadResponseDto> {
    return this.uploadsService.save(file, dto.purpose);
  }

  @Roles(UserRole.ADMIN)
  @RequirePermission('uploads:delete')
  @Delete()
  async remove(@Body() dto: DeleteUploadDto): Promise<null> {
    await this.uploadsService.remove(dto.url);
    return null;
  }
}
