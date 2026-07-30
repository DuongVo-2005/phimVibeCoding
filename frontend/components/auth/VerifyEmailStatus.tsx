'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { SkeletonBlock } from '@/components/ui/SkeletonBlock';
import { authApi } from '@/lib/api/auth';
import { ApiRequestError } from '@/lib/api/client';

type VerifyState = 'loading' | 'success' | 'already-verified' | 'expired' | 'invalid' | 'error';

const STATE_CONTENT: Record<
  Exclude<VerifyState, 'loading'>,
  { icon: string; iconClass: string; title: string; defaultMessage: string }
> = {
  success: {
    icon: 'check_circle',
    iconClass: 'text-primary',
    title: 'Xác thực email thành công',
    defaultMessage: 'Email của bạn đã được xác thực.',
  },
  'already-verified': {
    icon: 'verified',
    iconClass: 'text-primary',
    title: 'Email đã được xác thực',
    defaultMessage: 'Email này đã được xác thực trước đó.',
  },
  expired: {
    icon: 'schedule',
    iconClass: 'text-error',
    title: 'Đường dẫn đã hết hạn',
    defaultMessage: 'Đường dẫn xác thực đã hết hạn. Vui lòng yêu cầu gửi lại email xác thực.',
  },
  invalid: {
    icon: 'error',
    iconClass: 'text-error',
    title: 'Đường dẫn không hợp lệ',
    defaultMessage: 'Đường dẫn xác thực không hợp lệ.',
  },
  error: {
    icon: 'error',
    iconClass: 'text-error',
    title: 'Có lỗi xảy ra',
    defaultMessage: 'Có lỗi xảy ra, vui lòng thử lại sau.',
  },
};

/**
 * VerifyEmailStatus — Phase 33 (v1.1 — Verify Email). Đọc `token` từ query string, gọi
 * `GET /auth/verify-email` MỘT LẦN khi mount, hiện 1 trong 6 trạng thái theo yêu cầu Phase 33
 * (Loading/Success/Invalid/Expired/Already verified/Error).
 *
 * Backend trả HTTP status KHÁC NHAU cho từng trường hợp (`AuthService.verifyEmail` — 200/409/410/
 * 400), map thẳng qua `ApiRequestError.statusCode` thay vì so khớp chuỗi message tiếng Việt (dễ vỡ
 * khi đổi câu chữ). Lỗi mạng/không phải `ApiRequestError` (vd. backend sập) rơi vào `error` chung.
 *
 * `hasCalledRef` chặn gọi API 2 lần do React StrictMode (dev) tự double-invoke effect — cùng kỹ
 * thuật `shownSessionExpiredRef` đã dùng ở `LoginForm.tsx`. Không có kỹ thuật này, lần verify thứ 2
 * (StrictMode) sẽ luôn nhận "already-verified" thay vì "success" thật — sai lệch UI ngay từ lần
 * xác thực đầu tiên.
 */
export function VerifyEmailStatus() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  // Không có `token` -> trạng thái CUỐI được biết ngay tại lần render đầu (thuần derived state, cả
  // giá trị lẫn dữ liệu vào là `token` từ URL, không phải kết quả 1 lệnh gọi bất đồng bộ) — khởi
  // tạo lazy state trực tiếp thay vì set trong effect (tránh lint `react-hooks/set-state-in-effect`
  // — effect chỉ nên dành cho việc ĐỒNG BỘ với hệ thống ngoài, ở đây là gọi API xác thực thật).
  const [state, setState] = useState<VerifyState>(() => (token ? 'loading' : 'invalid'));
  const [message, setMessage] = useState<string | null>(null);
  const hasCalledRef = useRef(false);

  useEffect(() => {
    if (!token || hasCalledRef.current) return;
    hasCalledRef.current = true;

    authApi
      .verifyEmail(token)
      .then((result) => {
        setState('success');
        setMessage(result.message);
      })
      .catch((error) => {
        if (error instanceof ApiRequestError) {
          setMessage(error.message);
          if (error.statusCode === 410) {
            setState('expired');
          } else if (error.statusCode === 409) {
            setState('already-verified');
          } else {
            setState('invalid');
          }
        } else {
          setState('error');
        }
      });
  }, [token]);

  if (state === 'loading') {
    return (
      <div
        className="flex flex-col items-center gap-md bg-surface-container rounded-2xl p-lg text-center"
        aria-hidden="true"
      >
        <SkeletonBlock className="h-10 w-10 rounded-full" />
        <SkeletonBlock className="h-5 w-2/3 rounded" />
        <SkeletonBlock className="h-4 w-full rounded" />
      </div>
    );
  }

  const content = STATE_CONTENT[state];

  return (
    <div className="flex flex-col items-center gap-md bg-surface-container rounded-2xl p-lg text-center">
      <span
        className={`material-symbols-outlined text-[48px] ${content.iconClass}`}
        aria-hidden="true"
      >
        {content.icon}
      </span>
      <h1 className="text-headline-lg font-headline-lg text-on-surface">{content.title}</h1>
      <p className="text-body-md text-on-surface-variant">{message ?? content.defaultMessage}</p>

      {state === 'success' || state === 'already-verified' ? (
        <Link href="/user/profile" className="text-primary hover:underline text-label-md font-bold">
          Về trang tài khoản
        </Link>
      ) : state === 'expired' || state === 'invalid' ? (
        <Link href="/user/profile" className="text-primary hover:underline text-label-md font-bold">
          Gửi lại email xác thực
        </Link>
      ) : (
        <Link href="/" className="text-primary hover:underline text-label-md font-bold">
          Về trang chủ
        </Link>
      )}
    </div>
  );
}
