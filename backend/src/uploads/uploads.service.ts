import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { promises as fs } from 'fs';
import { join, normalize, resolve, sep } from 'path';
import { AppConfig } from '../config/configuration';
import { UploadPurpose } from '../common/constants';
import { UploadResponseDto } from './dto/upload-response.dto';

/** Chính sách upload (api_design.md §24 + implementation_roadmap.md Phase 8) — hằng số nội bộ
 * module, cùng nguyên tắc `FILM_TOP_METRICS` (films.service.ts): hằng số chỉ module này dùng thì
 * khai ngay tại service, không đưa vào `common/constants` dùng chung. */
export const UPLOAD_MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB — giới hạn CHÍNH SÁCH thật.
/** Trần Multer cấp thấp — CHỈ để chặn lạm dụng cực đoan (vd upload 500MB), không phải chính sách
 * thật. Chính sách 5MB thật được service tự kiểm tra (`file.size`) để luôn trả đúng envelope 400
 * chuẩn thay vì lỗi Multer thô — xem ghi chú tại `uploads.controller.ts`. */
export const UPLOAD_MULTER_SAFETY_LIMIT_BYTES = 10 * 1024 * 1024;

const ALLOWED_MIME_TYPES: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

@Injectable()
export class UploadsService {
  private readonly uploadsRoot = resolve(process.cwd(), 'uploads');

  constructor(private readonly configService: ConfigService) {}

  async save(
    file: Express.Multer.File | undefined,
    purpose: UploadPurpose,
  ): Promise<UploadResponseDto> {
    if (!file) {
      throw new BadRequestException('Vui lòng chọn file để upload');
    }

    const extension = ALLOWED_MIME_TYPES[file.mimetype];
    if (!extension) {
      throw new BadRequestException(
        `Định dạng file không được hỗ trợ (chỉ nhận ${Object.keys(ALLOWED_MIME_TYPES).join(', ')})`,
      );
    }

    if (file.size > UPLOAD_MAX_FILE_SIZE_BYTES) {
      throw new BadRequestException(
        `File vượt quá dung lượng tối đa cho phép (${UPLOAD_MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB)`,
      );
    }

    const filename = `${randomUUID()}${extension}`;
    const purposeDir = join(this.uploadsRoot, purpose);
    await fs.mkdir(purposeDir, { recursive: true });
    await fs.writeFile(join(purposeDir, filename), file.buffer);

    const appConfig = this.configService.get<AppConfig>('app')!;
    return {
      url: `${appConfig.publicBaseUrl}/uploads/${purpose}/${filename}`,
      filename,
      mimeType: file.mimetype,
      size: file.size,
    };
  }

  async remove(url: string): Promise<void> {
    const filePath = this.resolveUploadPath(url);

    try {
      await fs.unlink(filePath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new NotFoundException('Không tìm thấy file để xoá');
      }
      throw error;
    }
  }

  /**
   * Map `url` (tuyệt đối, do chính `save()` trả về trước đó) ngược lại thành đường dẫn file thật
   * trên đĩa — validate NGHIÊM để chặn path traversal: `url` phải đúng gốc `PUBLIC_BASE_URL` +
   * tiền tố `/uploads/`, và đường dẫn sau khi resolve tuyệt đối phải nằm TRONG `uploadsRoot`
   * (chặn payload dạng `/uploads/../../etc/passwd` hoặc URL trỏ ra ngoài, dù `URL`/`normalize` đã
   * lọc phần lớn nhưng kiểm tra prefix cuối cùng vẫn là lớp phòng thủ bắt buộc trước khi `unlink`).
   */
  private resolveUploadPath(url: string): string {
    const appConfig = this.configService.get<AppConfig>('app')!;
    const prefix = `${appConfig.publicBaseUrl}/uploads/`;

    if (!url.startsWith(prefix)) {
      throw new BadRequestException('URL không hợp lệ');
    }

    const relativePath = normalize(decodeURIComponent(url.slice(prefix.length)));
    const absolutePath = resolve(this.uploadsRoot, relativePath);

    if (absolutePath !== this.uploadsRoot && !absolutePath.startsWith(this.uploadsRoot + sep)) {
      throw new BadRequestException('URL không hợp lệ');
    }

    return absolutePath;
  }
}
