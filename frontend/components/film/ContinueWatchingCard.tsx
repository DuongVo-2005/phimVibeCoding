import Image from 'next/image';

/**
 * ContinueWatchingCard — khớp card "Tiếp tục xem" trong design/homepage.html (thumbnail tỉ lệ
 * video, thanh tiến độ, icon play khi hover). Chỉ presentational — `progressPercent` do nơi gọi
 * truyền vào (mock ở Phase 10.2), không tự tính toán/lưu tiến độ xem thật (đó là business logic
 * của module Histories, ngoài phạm vi phase này).
 */
export function ContinueWatchingCard({
  title,
  subtitle,
  imageSrc,
  progressPercent,
}: {
  title: string;
  subtitle: string;
  imageSrc: string;
  progressPercent: number;
}) {
  return (
    <div className="bg-surface-container/60 p-base rounded-[20px] group cursor-pointer hover:bg-white/5 transition-all">
      <div className="relative aspect-video rounded-xl overflow-hidden mb-base">
        <Image
          src={imageSrc}
          alt={title}
          fill
          sizes="(max-width: 768px) 280px, 25vw"
          className="object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
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
    </div>
  );
}
