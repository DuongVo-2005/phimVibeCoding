import Link from 'next/link';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  // Khớp nút CTA chính (vd. "Xem Ngay") trong design/*.html.
  primary:
    'bg-primary text-on-primary font-bold shadow-lg shadow-primary/20 hover:scale-105 active:scale-95',
  // Khớp nút phụ kiểu "glass panel" (vd. "Danh Sách") — thay .glass-panel bằng class tương đương.
  secondary:
    'bg-white/[0.03] backdrop-blur-xl border border-white/10 text-on-surface hover:bg-white/10',
  // Khớp nút icon tròn nhỏ (thông báo, mạng xã hội...).
  ghost: 'text-on-surface hover:bg-white/5',
};

type CommonProps = {
  variant?: ButtonVariant;
  children: ReactNode;
  className?: string;
};

type ButtonAsButton = CommonProps &
  ButtonHTMLAttributes<HTMLButtonElement> & {
    href?: undefined;
  };

type ButtonAsLink = CommonProps & {
  href: string;
};

export type ButtonProps = ButtonAsButton | ButtonAsLink;

// Phase 18: thêm focus-visible:outline-primary — trước đây thiếu (audit phát hiện), khác các nút
// khác trong app (Pagination/CommentItem/Carousel...) đều đã có ring này. `Button` là component
// dùng nhiều nhất (FilmHero/HeroBanner/LoginForm/RegisterForm/ChangePasswordForm/ErrorState...) nên
// thiếu focus ring chuẩn ảnh hưởng rộng nhất.
const BASE_CLASSES =
  'inline-flex items-center justify-center gap-base rounded-lg px-md py-base text-label-md font-label-md font-bold transition-all duration-300 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary';

export function Button(props: ButtonProps) {
  const { variant = 'primary', children, className = '' } = props;
  const classes = `${BASE_CLASSES} ${VARIANT_CLASSES[variant]} ${className}`.trim();

  if ('href' in props && props.href !== undefined) {
    return (
      <Link href={props.href} className={classes}>
        {children}
      </Link>
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- omit khỏi ...rest trước khi spread vào <button>
  const { variant: _variant, children: buttonChildren, className: _className, ...rest } = props;

  return (
    <button type="button" className={classes} {...rest}>
      {buttonChildren}
    </button>
  );
}
