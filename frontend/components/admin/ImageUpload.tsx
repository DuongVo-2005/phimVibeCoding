'use client';

import { useSession } from 'next-auth/react';
import { useId, useRef, useState, type ChangeEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { useNotification } from '@/hooks/useNotification';
import { ApiRequestError } from '@/lib/api/client';
import { uploadsApi } from '@/lib/api/uploads';
import type { UploadPurpose } from '@/lib/types/upload';

const ACCEPTED_MIME_TYPES = 'image/jpeg,image/png,image/webp';

/**
 * ImageUpload — Phase 31 (v1.1 Upload Module). Component controlled thuần (`value`/`onChange`,
 * cùng triết lý `SearchableMultiSelect`) — nơi gọi bọc qua `Controller` của react-hook-form (form
 * hiện tại chỉ dùng `register()` cho input thường; `ImageUpload` là widget custom đầu tiên cần
 * `Controller`, KHÔNG thể spread `register()` thẳng vào input file/preview).
 *
 * GIỮ NGUYÊN ô nhập URL trực tiếp (không thay thế hoàn toàn bằng upload) — 81 phim hiện có trong
 * DB đều dùng URL crawl từ Ophim (img.ophim.live), admin sửa phim cũ vẫn cần xem/sửa URL đó trực
 * tiếp mà không bị ép re-upload. "Thay thế workflow URL-only NƠI PHÙ HỢP" (yêu cầu Phase 31) —
 * nghĩa là THÊM lựa chọn upload thật, không xoá lựa chọn URL.
 *
 * Khi upload file MỚI thành công và trường trước đó ĐANG có giá trị: gọi `uploadsApi.remove()`
 * best-effort để dọn file cũ (đúng mục đích `DELETE /uploads` — tránh rác tích luỹ khi "thay ảnh"
 * nhiều lần) — im lặng bỏ qua lỗi (URL cũ có thể là ảnh ngoài hệ thống như img.ophim.live, backend
 * đã tự chặn xoá nhầm — xem `UploadsService.resolveUploadPath`), vì hành động CHÍNH (đặt ảnh mới)
 * đã thành công, lỗi dọn dẹp phụ không nên chặn/làm người dùng hoang mang.
 */
export function ImageUpload({
  label,
  value,
  onChange,
  purpose,
  error,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  purpose: UploadPurpose;
  error?: string;
}) {
  const { data: session } = useSession();
  const accessToken = session?.accessToken;
  const notify = useNotification();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const urlInputId = useId();
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [previewFailed, setPreviewFailed] = useState(false);

  const handleFileSelect = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (!accessToken) {
      notify.error('Yêu cầu đăng nhập admin để upload.');
      return;
    }

    setUploadError(null);
    setPreviewFailed(false);
    setIsUploading(true);
    setProgress(0);
    const previousValue = value;

    try {
      const result = await uploadsApi.uploadImage(file, purpose, accessToken, setProgress);
      onChange(result.url);
      notify.success('Đã upload ảnh thành công.');
      if (previousValue) {
        uploadsApi.remove(previousValue, accessToken).catch(() => {});
      }
    } catch (uploadErr) {
      setUploadError(uploadErr instanceof ApiRequestError ? uploadErr.message : 'Upload thất bại.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = () => {
    const previousValue = value;
    onChange('');
    setPreviewFailed(false);
    if (previousValue && accessToken) {
      uploadsApi.remove(previousValue, accessToken).catch(() => {});
    }
  };

  return (
    <div className="flex flex-col gap-xs">
      <label htmlFor={urlInputId} className="text-label-md font-label-md text-on-surface-variant">
        {label}
      </label>

      <div className="flex flex-col sm:flex-row gap-sm">
        {value && !previewFailed ? (
          <div className="relative w-24 h-24 shrink-0 rounded-xl overflow-hidden bg-surface-container-high">
            {/* eslint-disable-next-line @next/next/no-img-element -- URL tuỳ ý (crawl ngoài hoặc
                upload nội bộ), không giới hạn domain như next/image yêu cầu, cùng lý do đã ghi ở
                AdminAvatarView.tsx */}
            <img
              src={value}
              alt=""
              className="w-full h-full object-cover"
              onError={() => setPreviewFailed(true)}
            />
          </div>
        ) : null}

        <div className="flex-1 flex flex-col gap-sm">
          <input
            id={urlInputId}
            type="text"
            value={value}
            onChange={(event) => {
              onChange(event.target.value);
              setPreviewFailed(false);
            }}
            placeholder="Dán URL ảnh, hoặc chọn file bên dưới"
            className="w-full bg-surface-container-high border border-transparent rounded-xl px-md py-base text-body-md text-on-surface outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          />

          <div className="flex items-center gap-sm">
            <Button
              type="button"
              variant="secondary"
              className="px-md py-xs text-label-md"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
            >
              {isUploading ? `Đang upload... ${progress}%` : 'Chọn file để upload'}
            </Button>
            {value ? (
              <button
                type="button"
                onClick={handleRemoveImage}
                className="text-error hover:underline text-label-md font-bold"
              >
                Xoá ảnh
              </button>
            ) : null}
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_MIME_TYPES}
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {isUploading ? (
            <div className="h-1.5 w-full rounded-full bg-surface-container-high overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-150"
                style={{ width: `${progress}%` }}
              />
            </div>
          ) : null}
        </div>
      </div>

      {uploadError || error ? (
        <span className="text-label-md text-error">{uploadError ?? error}</span>
      ) : null}
    </div>
  );
}
