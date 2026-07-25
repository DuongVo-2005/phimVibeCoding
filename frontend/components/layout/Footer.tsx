/**
 * Footer — khớp chữ ký class `bg-surface-container-low border-t border-outline-variant/30`
 * xuất hiện nhất quán trên cả 7 trang design/*.html. Link/nút mạng xã hội giữ nguyên href="#"
 * như thiết kế gốc (chưa có trang đích thật — không tự tạo route mới).
 */
const FOOTER_LINKS = [
  'Hỏi-Đáp',
  'Chính sách bảo mật',
  'Điều khoản sử dụng',
  'Giới thiệu',
  'Liên hệ',
];

const SOCIAL_ICONS: Array<{ icon: string; label: string }> = [
  { icon: 'public', label: 'Website' },
  { icon: 'chat_bubble', label: 'Chat' },
  { icon: 'share', label: 'Chia sẻ' },
];

export function Footer() {
  return (
    <footer className="w-full flex flex-col items-center justify-center gap-md px-gutter text-center py-lg bg-surface-container-low border-t border-outline-variant/30">
      <span className="text-headline-lg font-bold text-on-surface tracking-tighter">RoPhim</span>
      <div className="flex flex-wrap justify-center gap-md">
        {FOOTER_LINKS.map((label) => (
          <a
            key={label}
            href="#"
            className="text-on-surface-variant hover:text-on-surface text-label-md transition-colors"
          >
            {label}
          </a>
        ))}
      </div>
      <p className="text-body-md font-body-md text-on-surface-variant opacity-80">
        © 2026 RoPhim. Bản quyền thuộc về RoPhim.
      </p>
      <div className="flex gap-md mt-base">
        {SOCIAL_ICONS.map(({ icon, label }) => (
          <button
            key={icon}
            type="button"
            aria-label={label}
            className="w-10 h-10 rounded-full bg-white/[0.03] border border-white/10 backdrop-blur-xl flex items-center justify-center hover:bg-primary hover:text-on-primary transition-all duration-300"
          >
            <span className="material-symbols-outlined" aria-hidden="true">
              {icon}
            </span>
          </button>
        ))}
      </div>
    </footer>
  );
}
