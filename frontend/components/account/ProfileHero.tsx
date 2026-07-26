import Image from 'next/image';

/**
 * ProfileHero — khớp phần hero hồ sơ trong `design/userdasboard.html`. Model dữ liệu khác hẳn
 * `FilmHero`/`ActorHero` (không có quality/duration/genres hay birthdate/awards) nên không mở
 * rộng 2 component đó.
 *
 * Phase 17A: bỏ badge "PREMIUM"/"verified"/điểm thưởng/số phim đã xem/ảnh banner — đây đều là dữ
 * liệu không có thật ở backend (không có hệ thống subscription/điểm thưởng/email-verified nào,
 * xem audit Phase 17), giữ lại UI này sẽ vi phạm yêu cầu "thay TOÀN BỘ mock bằng dữ liệu thật".
 * Banner ảnh thay bằng gradient dùng token màu có sẵn (không phải ảnh mock). `avatarSrc` optional
 * — `GET /users/me` chỉ trả `avatar` dạng ObjectId tham chiếu `ImgAvatar` (KHÔNG populate thành
 * URL, xem `users.service.ts`.findById), nên hiện tại luôn hiện icon "person" thay thế thay vì cố
 * dựng URL sai từ 1 id.
 *
 * Review sau Phase 17A: khối desktop trước đó cố định `h-64` (256px, kích thước tính cho ảnh
 * banner + 2 dòng chữ + badge) — sau khi bỏ ảnh/badge, nội dung còn lại (avatar + 2 dòng chữ) chỉ
 * chiếm góc trái, để lại khoảng trống rất lớn bên phải/dưới (xác nhận qua screenshot thật, không
 * đoán). Đổi sang chiều cao TỰ NHIÊN theo nội dung (padding thay vì `h-64` cố định) — thuần layout,
 * không thêm dữ liệu/thành phần nào.
 */
export function ProfileHero({
  name,
  memberSinceLabel,
  avatarSrc,
}: {
  name: string;
  memberSinceLabel: string;
  avatarSrc?: string;
}) {
  return (
    <section className="relative">
      {/* Desktop — chiều cao tự nhiên theo nội dung (padding), không còn h-64 cố định (ảnh banner
          đã bỏ, giữ nguyên chiều cao cũ sẽ để lại khoảng trống lớn). */}
      <div className="hidden md:flex items-center gap-md w-full rounded-xl shadow-2xl bg-gradient-to-br from-surface-container to-surface-container-high px-lg py-lg">
        <div className="relative h-24 w-24 rounded-2xl overflow-hidden border-4 border-primary shadow-2xl shrink-0 bg-surface-container-high flex items-center justify-center">
          {avatarSrc ? (
            <Image src={avatarSrc} alt={name} fill sizes="96px" className="object-cover" />
          ) : (
            <span
              className="material-symbols-outlined text-on-surface-variant text-[40px]"
              aria-hidden="true"
            >
              person
            </span>
          )}
        </div>
        <div>
          <h1 className="text-headline-xl font-bold text-on-surface">{name}</h1>
          <p className="text-body-md text-on-surface-variant mt-xs">
            Thành viên từ {memberSinceLabel}
          </p>
        </div>
      </div>

      {/* Mobile */}
      <div className="md:hidden bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-xl p-6 flex items-center gap-5 overflow-hidden relative">
        <div className="relative w-20 h-20 rounded-full border-2 border-primary/30 p-1 overflow-hidden shrink-0 bg-surface-container-high flex items-center justify-center">
          {avatarSrc ? (
            <Image
              src={avatarSrc}
              alt={name}
              fill
              sizes="80px"
              className="object-cover rounded-full"
            />
          ) : (
            <span
              className="material-symbols-outlined text-on-surface-variant text-[32px]"
              aria-hidden="true"
            >
              person
            </span>
          )}
        </div>
        <div className="flex-1">
          <h1 className="font-headline-md text-headline-md text-on-surface">{name}</h1>
          <p className="text-on-surface-variant font-label-md">Thành viên từ {memberSinceLabel}</p>
        </div>
      </div>
    </section>
  );
}
