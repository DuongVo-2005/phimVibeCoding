import Image from 'next/image';
import Link from 'next/link';

/**
 * ContinueWatchingCard — khớp card "Tiếp tục xem" trong design/homepage.html (thumbnail tỉ lệ
 * video, thanh tiến độ, icon play khi hover). `progressPercent` do nơi gọi truyền vào, không tự
 * tính toán/lưu tiến độ xem thật (đó là business logic của module Histories, ngoài phạm vi).
 *
 * Phase 16A: bọc trong `Link` tới `href` (Watch Page, `buildWatchUrl(film.slug)` không kèm
 * `ep`/`server` — `ContinueWatchingSection` truyền vào, xem ghi chú ở đó) — trước đây chỉ là
 * `<div>` trang trí, `cursor-pointer` đánh lừa cảm giác click được nhưng không điều hướng.
 *
 * Phase 16C: hover chuẩn hoá theo pattern "Movie Card" dùng chung (scale ảnh nhẹ + overlay + shadow,
 * `duration-300 ease-out`) — trước đây `scale-110`/`duration-500` lệch so với `MovieCard`.
 */
export function ContinueWatchingCard({
  title,
  subtitle,
  imageSrc,
  progressPercent,
  href,
}: {
  title: string;
  subtitle: string;
  imageSrc: string;
  progressPercent: number;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="block bg-surface-container/60 p-base rounded-[20px] group hover:bg-white/5 hover:shadow-lg hover:shadow-black/30 transition-all duration-300 ease-out"
    >
      <div className="relative aspect-video rounded-xl overflow-hidden mb-base bg-surface-container-high">
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt={title}
            fill
            sizes="(max-width: 768px) 280px, 25vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300 ease-out"
          />
        ) : null}
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-out">
          <span className="material-symbols-outlined text-white text-[48px]" aria-hidden="true">
            play_circle
          </span>
        </div>
        <div className="absolute bottom-0 left-0 w-full h-1 bg-white/10">
          <div className="h-full bg-secondary-container" style={{ width: `${progressPercent}%` }} />
        </div>
      </div>
      <div className="px-2">
        <h3 className="font-bold text-body-lg text-on-surface">{title}</h3>
        <p className="text-label-md text-on-surface-variant">{subtitle}</p>
      </div>
    </Link>
  );
}
