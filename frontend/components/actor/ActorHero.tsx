import Image from 'next/image';

/**
 * ActorHero — khớp phần hero ảnh chân dung trong `design/actorprofile.html`. Nút back mobile
 * KHÔNG nằm trong component này — do `Header` tự xử lý qua route `/dien-vien/` (quyết định A,
 * Phase 10.7, tái sử dụng biến thể back-button có sẵn của `/phim/[slug]`).
 *
 * Ảnh nền: chỉ 1 ảnh (theo bản desktop, xem lý do trong `_mock/actorprofile-data.ts`) — không
 * dựng 2 `<Image>` chồng nhau theo breakpoint như design gốc.
 *
 * Quyết định D (Phase 10.7): không có nút "Đọc thêm" cho `shortBio` mobile — dùng `line-clamp-2`
 * CSS thuần, đúng nguyên tắc D2 Phase 10.4.
 */
export function ActorHero({
  name,
  roleLabel,
  rating,
  ratingLabel,
  ageLocation,
  shortBio,
  heroImageSrc,
}: {
  name: string;
  roleLabel: string;
  rating: string;
  ratingLabel: string;
  ageLocation: string;
  shortBio: string;
  heroImageSrc: string;
}) {
  return (
    <header className="relative w-full min-h-[500px] lg:h-[870px] flex items-end overflow-hidden">
      <div className="absolute inset-0 z-0">
        <Image src={heroImageSrc} alt="" fill priority sizes="100vw" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
      </div>

      <div className="relative z-10 px-gutter pb-xl w-full max-w-screen-2xl mx-auto">
        {/* Desktop: nhãn + tên + rating + tuổi/nơi sinh + chia sẻ */}
        <div className="hidden md:flex flex-col gap-xs">
          <span className="text-primary font-bold text-label-md tracking-widest uppercase">
            {roleLabel}
          </span>
          <h1 className="text-display-lg font-display-lg text-on-surface">{name}</h1>
          <div className="flex items-center gap-md mt-sm">
            <div className="flex items-center gap-xs">
              <span
                className="material-symbols-outlined text-primary"
                style={{ fontVariationSettings: "'FILL' 1" }}
                aria-hidden="true"
              >
                star
              </span>
              <span className="text-body-lg font-body-lg text-on-surface">
                {rating} {ratingLabel}
              </span>
            </div>
            <div className="h-4 w-px bg-white/20" />
            <span className="text-body-lg font-body-lg text-on-surface/70">{ageLocation}</span>
            <div className="h-4 w-px bg-white/20" />
            <button
              type="button"
              className="flex items-center gap-xs text-primary hover:underline transition-all"
            >
              <span className="material-symbols-outlined" aria-hidden="true">
                share
              </span>
              <span className="text-label-md font-label-md">Chia sẻ</span>
            </button>
          </div>
        </div>

        {/* Mobile: nhãn + tên + tiểu sử ngắn + CTA */}
        <div className="md:hidden flex flex-col gap-2">
          <span className="text-primary font-label-md text-label-md tracking-widest uppercase">
            {roleLabel}
          </span>
          <h1 className="font-headline-xl text-headline-xl text-on-surface leading-none">{name}</h1>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-md line-clamp-2">
            {shortBio}
          </p>
          <div className="flex gap-4 mt-4">
            <button
              type="button"
              className="bg-primary-container text-on-primary-container px-6 py-3 rounded-xl font-label-md text-label-md flex items-center gap-2"
            >
              <span
                className="material-symbols-outlined"
                style={{ fontVariationSettings: "'FILL' 1" }}
                aria-hidden="true"
              >
                play_arrow
              </span>
              Xem Trailer
            </button>
            <button
              type="button"
              className="bg-white/10 backdrop-blur-md border border-white/10 text-on-surface px-6 py-3 rounded-xl font-label-md text-label-md flex items-center gap-2"
            >
              <span className="material-symbols-outlined" aria-hidden="true">
                add
              </span>
              Theo dõi
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
