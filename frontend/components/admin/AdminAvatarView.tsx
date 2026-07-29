'use client';

import { useQuery } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Input } from '@/components/ui/Input';
import { SkeletonBlock } from '@/components/ui/SkeletonBlock';
import { useNotification } from '@/hooks/useNotification';
import { ApiRequestError } from '@/lib/api/client';
import {
  useCreateAvatarImageMutation,
  useCreateAvatarTypeMutation,
  useDeleteAvatarImageMutation,
  useDeleteAvatarTypeMutation,
} from '@/lib/query/mutations';
import { avatarsQueryOptions } from '@/lib/query/options';
import type { ImgAvatar, TypeAvatar } from '@/lib/types/avatar';
import { ConfirmDialog } from './ConfirmDialog';
import { Select } from './Select';

/**
 * AdminAvatarView — Phase 19B.10. `avatars.controller.ts` chỉ có Create + Delete cho cả 2 sub-
 * resource (type/image) — KHÔNG có route Update, nên không có form "Sửa" riêng, cùng cấu trúc
 * trang duy nhất (không tách route `/moi`/`/[id]` như Category/Country/Actor/Director — những
 * module đó cần Edit thật).
 *
 * `url` là chuỗi text nhập tay (không upload file) — đúng BLOCKER đã xác nhận ở Phase 19B (chưa
 * có UploadModule). Ảnh preview dùng `<img>` thường (không phải `next/image`) — URL admin nhập tuỳ
 * ý, không giới hạn domain như `img.ophim.live` (đã whitelist trong `next.config.ts` cho phim),
 * `next/image` sẽ lỗi 400 với domain lạ chưa khai báo.
 */
export function AdminAvatarView() {
  const notify = useNotification();
  const [typeFilter, setTypeFilter] = useState('');
  const [newTypeName, setNewTypeName] = useState('');
  const [newImageType, setNewImageType] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [deleteTypeTarget, setDeleteTypeTarget] = useState<TypeAvatar | null>(null);
  const [deleteImageTarget, setDeleteImageTarget] = useState<ImgAvatar | null>(null);

  const typesQuery = useQuery(avatarsQueryOptions.types());
  const imagesQuery = useQuery(avatarsQueryOptions.images(typeFilter || undefined));

  const createTypeMutation = useCreateAvatarTypeMutation();
  const createImageMutation = useCreateAvatarImageMutation();
  const deleteTypeMutation = useDeleteAvatarTypeMutation();
  const deleteImageMutation = useDeleteAvatarImageMutation();

  const typeOptions = (typesQuery.data ?? []).map((type) => ({
    value: type._id,
    label: type.name,
  }));
  const typeNameById = new Map((typesQuery.data ?? []).map((type) => [type._id, type.name]));

  const submitCreateType = (event: FormEvent) => {
    event.preventDefault();
    if (!newTypeName.trim()) return;
    createTypeMutation.mutate(
      { name: newTypeName.trim() },
      {
        onSuccess: () => {
          notify.success('Đã tạo loại avatar.');
          setNewTypeName('');
        },
        onError: (error) =>
          notify.error(error instanceof ApiRequestError ? error.message : 'Tạo thất bại.'),
      },
    );
  };

  const submitCreateImage = (event: FormEvent) => {
    event.preventDefault();
    if (!newImageType || !newImageUrl.trim()) return;
    createImageMutation.mutate(
      { type: newImageType, url: newImageUrl.trim() },
      {
        onSuccess: () => {
          notify.success('Đã thêm avatar.');
          setNewImageUrl('');
        },
        onError: (error) =>
          notify.error(error instanceof ApiRequestError ? error.message : 'Thêm thất bại.'),
      },
    );
  };

  return (
    <div className="flex flex-col gap-xl">
      <div>
        <h1 className="text-headline-lg font-headline-lg text-on-surface">Quản lý Avatar</h1>
        <p className="text-body-md text-on-surface-variant">
          Danh sách avatar có sẵn cho người dùng chọn (URL ảnh, không upload file).
        </p>
      </div>

      <section className="flex flex-col gap-md rounded-2xl bg-surface-container p-lg">
        <h2 className="text-headline-md font-headline-md text-on-surface">Loại Avatar</h2>

        <form onSubmit={submitCreateType} className="flex flex-col sm:flex-row gap-sm items-end">
          <div className="flex-1 w-full">
            <Input
              id="new-avatar-type-name"
              label="Tên loại mới"
              value={newTypeName}
              onChange={(event) => setNewTypeName(event.target.value)}
            />
          </div>
          <Button type="submit" variant="primary" disabled={createTypeMutation.isPending}>
            {createTypeMutation.isPending ? 'Đang thêm...' : 'Thêm loại'}
          </Button>
        </form>

        {typesQuery.isError ? (
          <ErrorState message="Không tải được loại avatar." onRetry={() => typesQuery.refetch()} />
        ) : typesQuery.isLoading ? (
          <SkeletonBlock className="h-24 rounded-xl" />
        ) : !typesQuery.data || typesQuery.data.length === 0 ? (
          <EmptyState icon="face" message="Chưa có loại avatar nào." />
        ) : (
          <div className="flex flex-wrap gap-sm">
            {typesQuery.data.map((type) => (
              <div
                key={type._id}
                className="flex items-center gap-sm rounded-full border border-white/10 bg-surface-container-high px-md py-1"
              >
                <span className="text-label-md text-on-surface">{type.name}</span>
                <button
                  type="button"
                  onClick={() => setDeleteTypeTarget(type)}
                  className="text-error text-label-md font-bold hover:underline"
                >
                  Xoá
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-md rounded-2xl bg-surface-container p-lg">
        <h2 className="text-headline-md font-headline-md text-on-surface">Ảnh Avatar</h2>

        <form onSubmit={submitCreateImage} className="flex flex-col sm:flex-row gap-sm items-end">
          <div className="w-full sm:w-48">
            <Select
              label="Loại"
              value={newImageType}
              onChange={(event) => setNewImageType(event.target.value)}
              options={typeOptions}
              placeholder="Chọn loại"
            />
          </div>
          <div className="flex-1 w-full">
            <Input
              id="new-avatar-image-url"
              label="URL ảnh"
              value={newImageUrl}
              onChange={(event) => setNewImageUrl(event.target.value)}
            />
          </div>
          <Button
            type="submit"
            variant="primary"
            disabled={createImageMutation.isPending || !newImageType}
          >
            {createImageMutation.isPending ? 'Đang thêm...' : 'Thêm ảnh'}
          </Button>
        </form>

        <div className="w-full sm:w-64">
          <Select
            label="Lọc theo loại"
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
            options={typeOptions}
          />
        </div>

        {imagesQuery.isError ? (
          <ErrorState
            message="Không tải được danh sách avatar."
            onRetry={() => imagesQuery.refetch()}
          />
        ) : imagesQuery.isLoading ? (
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-sm" aria-hidden="true">
            {Array.from({ length: 6 }).map((_, index) => (
              <SkeletonBlock key={index} className="aspect-square rounded-xl" />
            ))}
          </div>
        ) : !imagesQuery.data || imagesQuery.data.length === 0 ? (
          <EmptyState icon="image" message="Chưa có avatar nào." />
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-sm">
            {imagesQuery.data.map((image) => (
              <div key={image._id} className="flex flex-col gap-1">
                <div className="aspect-square rounded-xl overflow-hidden bg-surface-container-high">
                  {/* eslint-disable-next-line @next/next/no-img-element -- URL tuỳ ý, không whitelist domain như next/image yêu cầu, xem ghi chú đầu file */}
                  <img
                    src={image.url}
                    alt={typeNameById.get(image.type) ?? 'Avatar'}
                    className="w-full h-full object-cover"
                    onError={(event) => {
                      event.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setDeleteImageTarget(image)}
                  className="text-error text-label-md font-bold hover:underline"
                >
                  Xoá
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <ConfirmDialog
        open={deleteTypeTarget !== null}
        title="Xoá loại avatar"
        message={
          deleteTypeTarget
            ? `Xoá vĩnh viễn loại "${deleteTypeTarget.name}"? Không thể hoàn tác. Backend không tự xoá các ảnh avatar thuộc loại này.`
            : ''
        }
        confirmLabel="Xoá"
        isLoading={deleteTypeMutation.isPending}
        onCancel={() => setDeleteTypeTarget(null)}
        onConfirm={() => {
          if (!deleteTypeTarget) return;
          deleteTypeMutation.mutate(
            { id: deleteTypeTarget._id },
            {
              onSuccess: () => {
                notify.success('Đã xoá loại avatar.');
                setDeleteTypeTarget(null);
              },
              onError: (error) => {
                notify.error(error instanceof ApiRequestError ? error.message : 'Xoá thất bại.');
                setDeleteTypeTarget(null);
              },
            },
          );
        }}
      />

      <ConfirmDialog
        open={deleteImageTarget !== null}
        title="Xoá avatar"
        message="Xoá vĩnh viễn ảnh avatar này? Không thể hoàn tác."
        confirmLabel="Xoá"
        isLoading={deleteImageMutation.isPending}
        onCancel={() => setDeleteImageTarget(null)}
        onConfirm={() => {
          if (!deleteImageTarget) return;
          deleteImageMutation.mutate(
            { id: deleteImageTarget._id },
            {
              onSuccess: () => {
                notify.success('Đã xoá avatar.');
                setDeleteImageTarget(null);
              },
              onError: (error) => {
                notify.error(error instanceof ApiRequestError ? error.message : 'Xoá thất bại.');
                setDeleteImageTarget(null);
              },
            },
          );
        }}
      />
    </div>
  );
}
