import Image from 'next/image';

/**
 * ProfileHero — khớp phần hero hồ sơ trong `design/userdasboard.html`. Model dữ liệu khác hẳn
 * `FilmHero`/`ActorHero` (không có quality/duration/genres hay birthdate/awards) nên không mở
 * rộng 2 component đó — nội dung thật sự khác giữa mobile/desktop (banner+badge PREMIUM+thống kê
 * ở desktop; glass-card+verified-badge+điểm thưởng ở mobile), dùng 2 nhánh JSX như `ActorHero`.
 */
export function ProfileHero({
  name,
  premiumLabel,
  memberSinceLabel,
  moviesWatchedLabel,
  pointsLabel,
  avatarSrc,
  bannerSrc,
}: {
  name: string;
  premiumLabel: string;
  memberSinceLabel: string;
  moviesWatchedLabel: string;
  pointsLabel: string;
  avatarSrc: string;
  bannerSrc: string;
}) {
  return (
    <section className="relative">
      {/* Desktop: banner nền + avatar lớn + badge PREMIUM + thống kê */}
      <div className="hidden md:block relative h-64 w-full rounded-xl overflow-hidden shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-transparent z-10" />
        <Image src={bannerSrc} alt="" fill sizes="100vw" className="object-cover" />
        <div className="relative z-20 h-full flex flex-col justify-center px-lg">
          <div className="flex items-center gap-md">
            <div className="relative h-24 w-24 rounded-2xl overflow-hidden border-4 border-primary shadow-2xl shrink-0">
              <Image src={avatarSrc} alt={name} fill sizes="96px" className="object-cover" />
            </div>
            <div>
              <div className="flex items-center gap-sm">
                <h1 className="text-headline-xl font-bold text-on-surface">{name}</h1>
                <span className="bg-primary text-on-primary px-sm py-xs rounded-full text-label-md font-bold flex items-center gap-1">
                  <span
                    className="material-symbols-outlined text-[14px]"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                    aria-hidden="true"
                  >
                    star
                  </span>
                  {premiumLabel}
                </span>
              </div>
              <p className="text-body-md text-on-surface-variant mt-xs">
                Thành viên từ {memberSinceLabel} • {moviesWatchedLabel}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile: glass card avatar + badge verified + điểm thưởng */}
      <div className="md:hidden bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-xl p-6 flex items-center gap-5 overflow-hidden relative">
        <div className="relative shrink-0">
          <div className="relative w-20 h-20 rounded-full border-2 border-primary/30 p-1 overflow-hidden">
            <Image
              src={avatarSrc}
              alt={name}
              fill
              sizes="80px"
              className="object-cover rounded-full"
            />
          </div>
          <div className="absolute bottom-0 right-0 bg-primary text-on-primary w-6 h-6 rounded-full flex items-center justify-center border-2 border-surface">
            <span
              className="material-symbols-outlined text-[14px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
              aria-hidden="true"
            >
              verified
            </span>
          </div>
        </div>
        <div className="flex-1">
          <h1 className="font-headline-md text-headline-md text-on-surface">{name}</h1>
          <p className="text-on-surface-variant font-label-md">Thành viên Premium</p>
          <div className="mt-2 flex items-center gap-1 text-primary">
            <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
              stars
            </span>
            <span className="text-label-md">{pointsLabel}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
