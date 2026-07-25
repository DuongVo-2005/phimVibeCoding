import Image from 'next/image';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

/**
 * HeroBanner — khớp section hero trong design/homepage.html (badge xu hướng, meta, tiêu đề,
 * mô tả, 2 nút CTA "Xem Ngay"/"Danh Sách"). Chỉ presentational, props do trang chủ truyền vào
 * (dữ liệu mock ở Phase 10.2, chưa gọi API).
 */
export function HeroBanner({
  title,
  badge,
  meta,
  description,
  imageSrc,
}: {
  title: string;
  badge: string;
  meta: string;
  description: string;
  imageSrc: string;
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
        <p className="text-body-lg font-body-lg text-on-surface-variant max-w-xl">{description}</p>
        <div className="flex items-center gap-md pt-base">
          <Button variant="primary" className="text-headline-md px-lg py-md rounded-xl">
            <span className="material-symbols-outlined" aria-hidden="true">
              play_arrow
            </span>
            Xem Ngay
          </Button>
          <Button variant="secondary" className="text-headline-md px-lg py-md rounded-xl">
            <span className="material-symbols-outlined" aria-hidden="true">
              add
            </span>
            Danh Sách
          </Button>
        </div>
      </div>
    </section>
  );
}
