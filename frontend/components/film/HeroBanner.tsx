import Image from 'next/image';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { buildWatchUrl } from '@/lib/watch/url';

/**
 * HeroBanner — khớp section hero trong design/homepage.html (badge xu hướng, meta, tiêu đề,
 * mô tả, 2 nút CTA "Xem Ngay"/"Chi tiết"). Chỉ presentational, `slug` do `HeroSection` truyền vào
 * để tự dựng href — component này KHÔNG tự gọi API.
 *
 * Phase 16A: "Xem Ngay" → `buildWatchUrl(slug)` (trang xem phim, không kèm `ep`/`server` — dùng
 * đúng kiến trúc `WatchMovieView` đã có: khi URL không có `ep`, tự resolve tập đầu tiên). "Chi
 * tiết" (đổi tên từ "Danh Sách" — nút "Danh Sách"/thêm playlist không có trong yêu cầu, đổi thành
 * điều hướng tới Movie Detail) → `/phim/:slug`.
 *
 * Phase 16C: `description` rỗng → ẩn hẳn `<p>` (trước đây luôn render dù rỗng, để lại khoảng trắng
 * vô nghĩa — KHÔNG gọi thêm API lấy mô tả thật, theo đúng yêu cầu).
 */
export function HeroBanner({
  title,
  badge,
  meta,
  description,
  imageSrc,
  slug,
}: {
  title: string;
  badge: string;
  meta: string;
  description: string;
  imageSrc: string;
  slug: string;
}) {
  return (
    <section className="relative h-[70vh] min-h-[480px] w-full flex items-end pb-xl px-gutter overflow-hidden">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent z-10" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/40 to-transparent z-10" />
        <Image src={imageSrc} alt={title} fill priority sizes="100vw" className="object-cover" />
      </div>
      <div className="relative z-20 max-w-3xl space-y-md">
        <div className="flex items-center gap-base flex-wrap">
          <Badge variant="primary" className="text-label-md px-base py-1 rounded">
            {badge}
          </Badge>
          <span className="text-on-surface-variant text-label-md">{meta}</span>
        </div>
        <h1 className="font-display-lg text-display-lg text-white leading-tight">{title}</h1>
        {description ? (
          <p className="text-body-lg font-body-lg text-on-surface-variant max-w-xl">
            {description}
          </p>
        ) : null}
        <div className="flex items-center gap-md pt-base">
          <Button
            variant="primary"
            href={buildWatchUrl(slug)}
            className="text-headline-md px-lg py-md rounded-xl"
          >
            <span className="material-symbols-outlined" aria-hidden="true">
              play_arrow
            </span>
            Xem Ngay
          </Button>
          <Button
            variant="secondary"
            href={`/phim/${slug}`}
            className="text-headline-md px-lg py-md rounded-xl"
          >
            <span className="material-symbols-outlined" aria-hidden="true">
              info
            </span>
            Chi Tiết
          </Button>
        </div>
      </div>
    </section>
  );
}
