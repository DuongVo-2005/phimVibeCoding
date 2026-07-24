import { ArgumentMetadata, BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;

// Tên @Param() đã biết KHÔNG phải ObjectId trong toàn bộ controller hiện có — slug (Actors/
// Categories/Countries/Directors/Films) và targetType (enum của Favorites). Mọi @Param() khác
// trong dự án đều là ObjectId (id/filmId/roleId/targetId/...).
const NON_OBJECT_ID_PARAM_NAMES = new Set(['slug', 'targetType']);

/**
 * Áp dụng toàn cục (xem main.ts) — chỉ validate @Param() (metadata.type === 'param'), không đụng
 * @Body()/@Query() (đã có ValidationPipe/class-validator lo phần đó). Chặn CastError -> 500 khi
 * client gửi id sai định dạng, trả 400 fail-fast trước khi vào service layer, đúng
 * api_design.md §3.2 ("any ObjectId-typed path/body param must be a valid 24-hex-char ObjectId").
 */
@Injectable()
export class ParseObjectIdPipe implements PipeTransform {
  transform(value: unknown, metadata: ArgumentMetadata): unknown {
    if (metadata.type !== 'param' || !metadata.data || NON_OBJECT_ID_PARAM_NAMES.has(metadata.data)) {
      return value;
    }

    if (typeof value !== 'string' || !OBJECT_ID_REGEX.test(value)) {
      throw new BadRequestException(`${metadata.data} không hợp lệ`);
    }

    return value;
  }
}
