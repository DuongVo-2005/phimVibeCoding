'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

/** Nhãn cố định, không phụ thuộc segment cha. */
const STATIC_LABELS: Record<string, string> = {
  admin: 'Admin',
};

/**
 * Nhãn cho từng "khu quản lý" (`/admin/<section>`, `/admin/<section>/moi`,
 * `/admin/<section>/[slug]`) — Phase 19B.3: tách khỏi `STATIC_LABELS` phẳng vì "moi"/slug động
 * cần nhãn KHÁC NHAU tuỳ section cha (vd. "Tạo phim mới" vs "Tạo thể loại mới") — 1 map phẳng
 * dùng chung 1 khoá `moi` cho mọi section sẽ sai ngay khi có section thứ 2 (đã sửa lỗi này khi
 * thêm "the-loai"). Section chưa có trong map hiện nguyên slug thay vì bịa nhãn — không đoán route
 * chưa xác nhận.
 */
const SECTION_LABELS: Record<string, { list: string; create?: string; edit?: string }> = {
  phim: { list: 'Quản lý phim', create: 'Tạo phim mới', edit: 'Sửa phim' },
  'the-loai': { list: 'Quản lý thể loại', create: 'Tạo thể loại mới', edit: 'Sửa thể loại' },
  'quoc-gia': { list: 'Quản lý quốc gia', create: 'Tạo quốc gia mới', edit: 'Sửa quốc gia' },
  'dien-vien': { list: 'Quản lý diễn viên', create: 'Tạo diễn viên mới', edit: 'Sửa diễn viên' },
  'dao-dien': { list: 'Quản lý đạo diễn', create: 'Tạo đạo diễn mới', edit: 'Sửa đạo diễn' },
  // Không có sub-route /moi hay /[id] — chỉ có trang danh sách (hành động Ẩn/Hiện/Xoá làm ngay
  // tại chỗ, không điều hướng trang), nên không cần `create`/`edit`.
  'binh-luan': { list: 'Kiểm duyệt bình luận' },
  'nguoi-dung': { list: 'Quản lý người dùng', create: 'Tạo người dùng mới' },
  'vai-tro': { list: 'Role & Permission', create: 'Tạo role mới', edit: 'Sửa role' },
  avatar: { list: 'Quản lý Avatar' },
};

function labelFor(segment: string, parentSegment: string | undefined): string {
  if (STATIC_LABELS[segment]) return STATIC_LABELS[segment];

  const section = SECTION_LABELS[segment];
  if (section) return section.list;

  const parentSection = parentSegment ? SECTION_LABELS[parentSegment] : undefined;
  if (parentSection) {
    const dynamicLabel = segment === 'moi' ? parentSection.create : parentSection.edit;
    if (dynamicLabel) return dynamicLabel;
  }

  return segment;
}

/**
 * AdminBreadcrumb — tự dựng từ `pathname` (không cấu hình thủ công mỗi trang), khớp kỹ thuật đã
 * dùng ở `Navigation.tsx`/`Header.tsx` (`pathname.startsWith(...)`) — tránh double-source-of-truth
 * giữa route thật và breadcrumb khai báo tay. Cố tình KHÔNG fetch dữ liệu (vd. tên phim/thể loại
 * thật cho segment slug động) — chỉ gắn nhãn chung theo `SECTION_LABELS`.
 */
export function AdminBreadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);

  return (
    <nav aria-label="Breadcrumb" className="px-gutter py-sm text-label-md text-on-surface-variant">
      <ol className="flex items-center gap-xs flex-wrap">
        {segments.map((segment, index) => {
          const href = `/${segments.slice(0, index + 1).join('/')}`;
          const isLast = index === segments.length - 1;
          const label = labelFor(segment, segments[index - 1]);

          return (
            <li key={href} className="flex items-center gap-xs">
              {index > 0 ? (
                <span aria-hidden="true" className="text-on-surface-variant/50">
                  /
                </span>
              ) : null}
              {isLast ? (
                <span aria-current="page" className="text-on-surface font-bold">
                  {label}
                </span>
              ) : (
                <Link
                  href={href}
                  className="hover:text-on-surface transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary rounded"
                >
                  {label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
