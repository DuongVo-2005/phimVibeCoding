import { createHash } from 'crypto';
import slugify from 'slugify';

export function toSlug(value: string): string {
  const slug = slugify(value, { lower: true, strict: true, locale: 'vi' });
  if (slug) {
    return slug;
  }

  // Tên chỉ chứa ký tự không la-tinh hoá được (vd: Kanji/Hán) khiến slugify strict trả về rỗng.
  // Dùng hash ngắn, ổn định của chuỗi gốc làm slug dự phòng để luôn hợp lệ (required) và duy nhất.
  return `x-${createHash('md5').update(value).digest('hex').slice(0, 12)}`;
}
