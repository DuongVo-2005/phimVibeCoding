'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useNotification } from '@/hooks/useNotification';
import { authApi } from '@/lib/api/auth';
import { ApiRequestError } from '@/lib/api/client';
import type { UserProfile } from '@/lib/types/user';

const RESEND_COOLDOWN_SECONDS = 60;

/**
 * EmailVerificationStatus — Phase 33 (v1.1 — Verify Email). Hiện trạng thái xác thực email trên
 * trang hồ sơ (`UserDashboardView`) — nhận `user` từ `usersQueryOptions.me()` ĐÃ có sẵn ở nơi gọi
 * (không tự gọi query riêng, tránh trùng request).
 *
 * Trạng thái CHƯA xác thực có 2 giai đoạn: (1) chưa gửi lần nào trong phiên này → nút "Xác thực
 * Email" (gọi `POST /auth/send-verification-email`); (2) đã gửi ít nhất 1 lần → đổi thành thông
 * báo "đã gửi, kiểm tra hộp thư" + nút "Gửi lại Email" (`POST /auth/resend-verification-email`).
 * Cooldown 60s trên nút "Gửi lại" khớp `@Throttle({limit:3,ttl:60_000})` ở backend
 * (`auth.controller.ts`) — tránh người dùng bấm liên tục rồi nhận lỗi 429 khó hiểu; đây là UX
 * polish phía client, backend vẫn là nơi enforce thật.
 */
export function EmailVerificationStatus({ user }: { user: UserProfile }) {
  const { data: session } = useSession();
  const accessToken = session?.accessToken;
  const notify = useNotification();

  const [hasSent, setHasSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const startCooldown = () => {
    setCooldown(RESEND_COOLDOWN_SECONDS);
    intervalRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSend = async (isResend: boolean) => {
    if (!accessToken) return;
    setIsSubmitting(true);

    try {
      const result = isResend
        ? await authApi.resendVerificationEmail(accessToken)
        : await authApi.sendVerificationEmail(accessToken);
      notify.success(result.message);
      setHasSent(true);
      startCooldown();
    } catch (error) {
      notify.error(
        error instanceof ApiRequestError ? error.message : 'Có lỗi xảy ra, vui lòng thử lại sau.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (user.isEmailVerified) {
    return (
      <div className="flex items-center gap-xs text-label-md text-primary">
        <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
          verified
        </span>
        Email đã được xác thực
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-sm rounded-xl border border-primary/30 bg-primary/10 p-md">
      <div className="flex items-start gap-sm">
        <span
          className="material-symbols-outlined text-primary text-[20px] shrink-0"
          aria-hidden="true"
        >
          warning
        </span>
        <div className="flex-1">
          <p className="text-label-md font-bold text-on-surface">Email chưa được xác thực</p>
          <p className="text-label-md text-on-surface-variant">
            {hasSent
              ? `Email xác thực đã được gửi tới ${user.email}. Vui lòng kiểm tra hộp thư (kể cả mục spam).`
              : 'Xác thực email để bảo vệ tài khoản và nhận đầy đủ thông báo.'}
          </p>
        </div>
      </div>

      <Button
        type="button"
        variant="secondary"
        className="self-start px-md py-xs text-label-md"
        disabled={isSubmitting || cooldown > 0}
        onClick={() => handleSend(hasSent)}
      >
        {isSubmitting
          ? 'Đang gửi...'
          : cooldown > 0
            ? `Gửi lại sau ${cooldown}s`
            : hasSent
              ? 'Gửi lại Email'
              : 'Xác thực Email'}
      </Button>
    </div>
  );
}
