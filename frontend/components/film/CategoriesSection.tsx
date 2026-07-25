'use client';

import { useQuery } from '@tanstack/react-query';
import { categoriesQueryOptions } from '@/lib/query/options';
import { CategoryTile } from './CategoryTile';

/**
 * Phase 11.4: wiring `GET /categories` cho khối "Khám phá Thể loại" — thay
 * `_mock/homepage-data.ts`'s `categoryTiles`. Quyết định đã chốt: `Category` (backend) không có
 * field ảnh — ảnh nền/size/màu overlay tiếp tục là mapping TĨNH ở frontend (không sửa backend),
 * gán theo VỊ TRÍ (không theo tên/slug — danh mục thật từ backend không đoán trước được) để không
 * phụ thuộc vào danh sách category cụ thể nào. `label` là dữ liệu thật (`category.name`).
 * `CategoryTile` (presentational) không đổi.
 *
 * Bento layout gốc (`grid-cols-2 md:grid-cols-4`) được thiết kế đúng cho 1 tile lớn + 4 tile nhỏ
 * (5 ô) — giữ nguyên số lượng này (`slice`) để không đổi design.
 */
const CATEGORY_TILE_STYLES = [
  {
    size: 'large',
    overlayClassName: 'bg-black/40 group-hover:bg-black/20',
    imageSrc:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDdMpmjmd6JAJ1V1aW_vFEchEd829131-muO9tUs2QKiFyj31qkGH3WJON_kkWLoHPImoU9Kjegn67sgn0W8H73GrNb4vXUy7CvLUsc5cOsW_vOzJWpff6IO1Lk0CrYfnB4Cv2qpPtzgfRH7t3hG9YXcWw5LCGjpTb-6SUnNvw_tW_uzoHZeSOr4EQ5pMbunqk5RgBmSMRLA1Ot0y0iwhXHkSGqy66nJKAwtgmAnh80JZikCT62xQtpl8ewq5jfNKqqMvYSzonNcQZB',
  },
  {
    size: 'small',
    overlayClassName: 'bg-purple-900/40 group-hover:bg-purple-900/20',
    imageSrc:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDLHcsNjDUI-PfprOG8DVen3Duym5UaqpDLxWMj-guDGRixL1ecwYydMqRyQTUfCCpGOx6h2Ir6sOjBmFCNTlyRG82ACeEkFO8HEJRiEwIVHmV9N5qAy4CmPOxaoygd93VsMe0MmX3wd-fFuK2cHtG1RjdMUqxwPLGRNcsyUXZdNfQvRJ1UODiIvgU2J0iocBmsVkAA69it9qqnVi36ngBdrAo07lMduBRe9aIVHCrR1Nrgo2w8bHAWQlxL-4gI_jz0oqBgWMFtpQwY',
  },
  {
    size: 'small',
    overlayClassName: 'bg-blue-900/40 group-hover:bg-blue-900/20',
    imageSrc:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuB_0wywHHvfz_gcQipnHwgMwx6nu-_JZRfk7RGKgFIJiAJcIpiqO81JVsu-RD3Q5hf-ZzFdLraGmQd8KLLcAvB717JM15ARDAHUCJ2yQVhJICfhAAtDRoBu_CXV0dpTaWkAFl2kAfG0k9m5OxbQdLgy8f-dVieDK5TjKgM15iAQesMS2yiXW9nsmDAJSmgce5hDWv1f_XtlGCvnWHUGGAtffUHDr7uM3aDIsfu3fmBVVfGvD9AvmwjpdHVA112MBgC76juCBWyRFFVi',
  },
  {
    size: 'small',
    overlayClassName: 'bg-red-900/40 group-hover:bg-red-900/20',
    imageSrc:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAqjR3dHAObrB3ZrxvQ3jJsXL3o90HLhVl1vDs0Y56S9gUH0q2IzXPgAJpD8YxxSiALlBSQoKtab9RVDSmCq0KUpAbjIHFwnu6j3NijtwgL2kObvGAdWP7QqKbnKKOZWMA7gKyWykPPTzyZR8OZX72BqGwHBVq5PYEnqSHJqpqzSClIQEEMMzFT3CeCoVvbJ8Trd9CyPK2rReweCYr69K65UZP-ShAiPLJG2-ju_PAQQuwkDqm5ZReuMpPET1_WK3NDU03rBJYxceSs',
  },
  {
    size: 'small',
    overlayClassName: 'bg-green-900/40 group-hover:bg-green-900/20',
    imageSrc:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDizdWYU365AciMgByYzrgqXMb9xVb89qM3IosvGXLMUucnXYblF86P44SyaPKcNFCHo0xsQhj4TkWNyCmccezWasm1gjnilwev-uLAQl6Vbb0QEQYysddlq-ivIQqELjOAxLLcXXNIMB9RNX8YcJAuLCHXWjJ0KXEHlfMsN4S1vMSfrpcDssqVtkHOG3PkEJsFIJrLntus_RkuHVnvUjb-e9w_rmt7zo2e0SgvTFVH-E9D6tUG8bO4oTXoOJuOgPO8xKdcaDyREa-z',
  },
] as const;

export function CategoriesSection() {
  const { data } = useQuery(categoriesQueryOptions.list());
  const categories = (data ?? []).slice(0, CATEGORY_TILE_STYLES.length);

  // Rỗng/loading: không có thiết kế placeholder riêng cho khối này — ẩn khối cho tới khi có dữ
  // liệu.
  if (categories.length === 0) {
    return null;
  }

  return (
    <div className="lg:col-span-8 space-y-md">
      <h2 className="text-headline-lg font-headline-lg">Khám phá Thể loại</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-base">
        {categories.map((category, index) => {
          const style = CATEGORY_TILE_STYLES[index];
          return (
            <CategoryTile
              key={category._id}
              label={category.name}
              imageSrc={style.imageSrc}
              size={style.size}
              overlayClassName={style.overlayClassName}
            />
          );
        })}
      </div>
    </div>
  );
}
