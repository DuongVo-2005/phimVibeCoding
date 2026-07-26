'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, type ReactNode } from 'react';

const DEFAULT_SIZES = '(max-width: 768px) 140px, 240px';

/**
 * MovieCard (placeholder) — khớp pattern poster `aspect-[2/3] rounded-xl overflow-hidden` lặp
 * lại trong design/*.html. CHỈ presentational: không fetch dữ liệu, không gọi API — props do nơi
 * gọi truyền vào.
 *
 * 3 biến thể khớp đúng những gì có trong design, không tự thêm biến thể khác:
 * - `showTitle=true` (mặc định, không `rating`) — design/homepage.html mục "Đang thịnh hành":
 *   hiện tiêu đề + `badges` (trong overlay, chỉ khi hover).
 * - `showTitle=false` — design/homepage.html mục "Gợi ý riêng cho bạn": chỉ icon play khi hover.
 * - `showTitle=true` kèm `rating`/`genreLine` — design/moviecategory.html: overlay đầy đủ
 *   tiêu đề + điểm đánh giá + dòng thể loại + nút hành động (`showActions`). `cornerBadge` là nhãn
 *   luôn hiển thị góc phải trên (vd. "4K HDR"), khác vị trí với `badges` (chỉ hiện trong overlay
 *   khi hover, dùng ở homepage).
 *
 * Phase 16C (audit poster quality):
 * - `sizes`: trước đây hardcode 1 giá trị chung cho MỌI nơi gọi dù layout thật khác nhau (carousel
 *   cố định 200/240px vs grid `MovieListing` nhiều cột) — sai `sizes` khiến trình duyệt tải ảnh độ
 *   phân giải thấp hơn kích thước hiển thị thật (1 nguyên nhân gây "mờ"). Giờ là prop, mỗi nơi gọi
 *   tự truyền giá trị khớp layout của nó — giữ `DEFAULT_SIZES` (giá trị cũ) làm mặc định để không
 *   đổi hành vi nơi chưa được cập nhật.
 * - `quality`/`loading`: đã audit — không đổi.
 * - `priority` (Phase 18): quyết định cũ ở đây là KHÔNG thêm prop này (không nơi gọi nào đảm bảo
 *   "above the fold"). Audit Phase 18 xác nhận THẬT bằng console warning thật (Playwright, không
 *   đoán): khi `films/hot` rỗng (không phim nào `isHot`), `HeroSection` ẩn hẳn (`return null`) —
 *   Next.js khi đó phát hiện ảnh MovieCard ĐẦU TIÊN của `TrendingSection` (carousel ngay sau Hero)
 *   là LCP thật nhưng thiếu `priority`. Thêm prop tuỳ chọn `priority` (mặc định `false` — MỌI nơi
 *   gọi khác giữ nguyên hành vi cũ), CHỈ `TrendingSection` truyền `true` cho phần tử đầu tiên (xem
 *   `TrendingSection.tsx`) — carousel luôn render ngay sau Hero, gần "above the fold" nhất trong
 *   các MovieCard trên trang chủ.
 * - `placeholder="blur"`: KHÔNG áp dụng — cần `blurDataURL` (ảnh base64 độ phân giải cực thấp),
 *   backend hiện không trả field này cho `posterUrl`/`thumbUrl`, và ảnh là remote URL (không phải
 *   static import) nên Next.js không tự sinh được. Thêm hạ tầng tạo blurDataURL (vd. dịch vụ riêng
 *   hoặc xử lý ở backend) nằm ngoài phạm vi phase này.
 * - `fetchPriority`: Next.js tự set `fetchpriority="high"` khi `priority=true` — không cần khai
 *   báo thủ công thêm ở đây.
 *
 * Phase 16C (image fallback + hover chuẩn hoá): ảnh lỗi (`onError`) → chuyển sang icon "movie"
 * trang trí (cùng UI với trường hợp không có `imageSrc`) thay vì để `next/image` vỡ ảnh im lặng.
 * Hover chuẩn hoá `scale-105` (nhẹ hơn `scale-110` cũ) + `duration-300 ease-out` dùng chung cho mọi
 * "Movie Card" (khớp yêu cầu Phase 16C: image scale nhẹ + overlay + shadow, KHÔNG nhiều kiểu khác
 * nhau nữa).
 */
export function MovieCard({
  title,
  href = '#',
  imageSrc,
  badges,
  cornerBadge,
  showTitle = true,
  rating,
  genreLine,
  showActions = false,
  sizes = DEFAULT_SIZES,
  priority = false,
}: {
  title: string;
  href?: string;
  imageSrc?: string;
  badges?: ReactNode;
  cornerBadge?: ReactNode;
  showTitle?: boolean;
  rating?: string;
  genreLine?: string;
  showActions?: boolean;
  sizes?: string;
  priority?: boolean;
}) {
  const [imageError, setImageError] = useState(false);
  const showImage = Boolean(imageSrc) && !imageError;

  return (
    <Link
      href={href}
      aria-label={title}
      className="block min-w-[140px] aspect-[2/3] relative rounded-[20px] overflow-hidden group movie-card-glow transition-shadow duration-300 ease-out bg-surface-container-high"
    >
      {showImage ? (
        <Image
          src={imageSrc as string}
          alt={title}
          fill
          sizes={sizes}
          priority={priority}
          loading={priority ? 'eager' : undefined}
          className="object-cover transition-transform duration-300 ease-out group-hover:scale-105"
          onError={() => setImageError(true)}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-on-surface-variant">
          <span className="material-symbols-outlined text-[40px]" aria-hidden="true">
            movie
          </span>
        </div>
      )}

      {cornerBadge ? <div className="absolute top-md right-md z-20">{cornerBadge}</div> : null}

      {showTitle ? (
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity duration-300 ease-out flex flex-col justify-end p-md">
          <h3 className="font-bold text-headline-md text-white line-clamp-2">{title}</h3>
          {rating || genreLine ? (
            <div className="flex items-center gap-base mb-sm mt-1 text-xs">
              {rating ? <span className="text-primary font-bold">{rating}</span> : null}
              {genreLine ? (
                <span className="text-on-surface-variant">
                  {rating ? '• ' : ''}
                  {genreLine}
                </span>
              ) : null}
            </div>
          ) : null}
          {badges ? <div className="flex gap-2 mt-2">{badges}</div> : null}
          {showActions ? (
            <div className="flex gap-sm mt-2">
              <span className="flex-1 py-xs bg-white text-black rounded-lg font-label-md text-label-md flex items-center justify-center gap-xs">
                <span className="material-symbols-outlined text-base" aria-hidden="true">
                  play_arrow
                </span>
                Xem ngay
              </span>
              <span className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center text-white">
                <span className="material-symbols-outlined text-base" aria-hidden="true">
                  add
                </span>
              </span>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-out flex items-center justify-center">
          <span className="material-symbols-outlined text-white text-[32px]" aria-hidden="true">
            play_circle
          </span>
        </div>
      )}
    </Link>
  );
}
