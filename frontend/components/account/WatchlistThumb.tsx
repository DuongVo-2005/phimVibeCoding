import Image from 'next/image';
import Link from 'next/link';

/**
 * WatchlistThumb — khớp "Danh sách xem" trong `design/userdasboard.html`. Quyết định D (Phase
 * 10.8): 1 mô hình dữ liệu/hiển thị DUY NHẤT dùng chung mọi kích thước — không tách 2 kiểu như
 * design gốc (mobile: tiêu đề+tiến độ+thời gian còn lại; desktop: chỉ ảnh không chữ). Progress bar
 * + nhãn thời gian còn lại chỉ hiện khi có dữ liệu (`progressPercent`/`remainingLabel` optional).
 */
export function WatchlistThumb({
  title,
  imageSrc,
  progressPercent,
  remainingLabel,
  href = '#',
}: {
  title: string;
  imageSrc: string;
  progressPercent?: number;
  remainingLabel?: string;
  href?: string;
}) {
  return (
    <Link href={href} className="group block space-y-2">
      <div className="relative aspect-[2/3] rounded-lg overflow-hidden">
        <Image src={imageSrc} alt={title} fill sizes="33vw" className="object-cover" />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <span className="material-symbols-outlined text-white text-[32px]" aria-hidden="true">
            play_arrow
          </span>
        </div>
        {progressPercent !== undefined ? (
          <div className="absolute bottom-0 left-0 w-full h-1 bg-white/10">
            <div className="h-full bg-secondary" style={{ width: `${progressPercent}%` }} />
          </div>
        ) : null}
      </div>
      <div className="px-1">
        <p className="font-label-md text-on-surface line-clamp-1">{title}</p>
        {remainingLabel ? (
          <p className="text-[12px] text-on-surface-variant">{remainingLabel}</p>
        ) : null}
      </div>
    </Link>
  );
}
