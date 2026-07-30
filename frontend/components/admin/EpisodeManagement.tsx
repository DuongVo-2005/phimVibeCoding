'use client';

import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { SkeletonBlock } from '@/components/ui/SkeletonBlock';
import { useNotification } from '@/hooks/useNotification';
import { ApiRequestError } from '@/lib/api/client';
import {
  useCreateEpisodeMutation,
  useDeleteEpisodeMutation,
  useUpdateEpisodeMutation,
  useUpdateEpisodeOrderMutation,
} from '@/lib/query/mutations';
import { episodesQueryOptions } from '@/lib/query/options';
import type { CreateEpisodeInput, Episode, UpdateEpisodeInput } from '@/lib/types/episode';
import { ConfirmDialog } from './ConfirmDialog';
import { EpisodeFormDialog } from './EpisodeFormDialog';

/**
 * EpisodeManagement — Phase 35 (Episode Management API). Quản lý tập phim ĐỘC LẬP hoàn toàn với
 * `MovieForm`/thao tác Lưu phim (đúng yêu cầu "independent from Movie Update" trong spec phase) —
 * mọi thao tác (thêm/sửa/xoá/sắp xếp/ẩn-hiện) gọi thẳng API riêng của collection `episodes` (khớp
 * `episodes.controller.ts`/`film-episodes.controller.ts` thật) và tự invalidate/refetch ngay,
 * không đi qua submit form phim.
 *
 * KIẾN TRÚC TẠM THỜI có chủ đích (đã duyệt qua ADR Phase 35, xem `episode.schema.ts`): danh sách
 * tập quản lý ở đây thuộc collection `episodes` MỚI, tách biệt hoàn toàn với `Film.episodes`
 * (embedded, crawler ghi, trang xem phim công khai đang đọc) — xem RELEASE_NOTES.md và báo cáo
 * Phase 35, mục "Remaining architectural limitation". KHÔNG đổi trang xem phim công khai/crawler/
 * lịch sử xem ở phase này.
 */
export function EpisodeManagement({ filmId, filmTitle }: { filmId: string; filmTitle: string }) {
  const notify = useNotification();
  const { data: session } = useSession();
  const accessToken = session?.accessToken;

  const [formTarget, setFormTarget] = useState<Episode | 'new' | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Episode | null>(null);

  const episodesQuery = useQuery(episodesQueryOptions.byFilm(filmId, accessToken));
  const createMutation = useCreateEpisodeMutation();
  const updateMutation = useUpdateEpisodeMutation();
  const deleteMutation = useDeleteEpisodeMutation();
  const orderMutation = useUpdateEpisodeOrderMutation();

  const episodes = episodesQuery.data ?? [];

  const openCreateForm = () => {
    setFormError(null);
    setFormTarget('new');
  };

  const openEditForm = (episode: Episode) => {
    setFormError(null);
    setFormTarget(episode);
  };

  const closeForm = () => {
    setFormTarget(null);
    setFormError(null);
  };

  const handleFormSubmit = (body: CreateEpisodeInput | UpdateEpisodeInput) => {
    setFormError(null);
    if (formTarget === 'new') {
      createMutation.mutate(
        { filmId, body: body as CreateEpisodeInput },
        {
          onSuccess: () => {
            notify.success('Đã thêm tập phim.');
            closeForm();
          },
          onError: (error) =>
            setFormError(error instanceof ApiRequestError ? error.message : 'Thêm tập thất bại.'),
        },
      );
    } else if (formTarget) {
      updateMutation.mutate(
        { id: formTarget._id, filmId, body },
        {
          onSuccess: () => {
            notify.success('Đã lưu thay đổi.');
            closeForm();
          },
          onError: (error) =>
            setFormError(error instanceof ApiRequestError ? error.message : 'Lưu thất bại.'),
        },
      );
    }
  };

  const togglePublish = (episode: Episode) => {
    updateMutation.mutate(
      { id: episode._id, filmId, body: { isPublished: !episode.isPublished } },
      {
        onSuccess: () =>
          notify.success(episode.isPublished ? 'Đã ẩn tập phim.' : 'Đã hiển thị tập phim.'),
        onError: (error) =>
          notify.error(error instanceof ApiRequestError ? error.message : 'Cập nhật thất bại.'),
      },
    );
  };

  const moveEpisode = (episode: Episode, direction: -1 | 1) => {
    const targetOrder = episode.displayOrder + direction;
    if (targetOrder < 0 || targetOrder >= episodes.length) return;
    orderMutation.mutate(
      { id: episode._id, filmId, displayOrder: targetOrder },
      {
        onError: (error) =>
          notify.error(error instanceof ApiRequestError ? error.message : 'Sắp xếp lại thất bại.'),
      },
    );
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(
      { id: deleteTarget._id, filmId },
      {
        onSuccess: () => {
          notify.success('Đã xoá tập phim.');
          setDeleteTarget(null);
        },
        onError: (error) => {
          notify.error(error instanceof ApiRequestError ? error.message : 'Xoá thất bại.');
          setDeleteTarget(null);
        },
      },
    );
  };

  return (
    <section className="flex flex-col gap-md rounded-2xl bg-surface-container p-lg">
      <div className="flex items-center justify-between gap-md">
        <div>
          <h2 className="text-headline-md font-headline-md text-on-surface">Quản lý tập phim</h2>
          <p className="text-label-md text-on-surface-variant">{filmTitle}</p>
        </div>
        <Button variant="primary" onClick={openCreateForm}>
          Thêm tập
        </Button>
      </div>

      {episodesQuery.isError ? (
        <ErrorState
          message="Không tải được danh sách tập phim."
          onRetry={() => episodesQuery.refetch()}
        />
      ) : episodesQuery.isLoading ? (
        <div className="flex flex-col gap-sm" aria-hidden="true">
          {Array.from({ length: 3 }).map((_, index) => (
            <SkeletonBlock key={index} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : episodes.length === 0 ? (
        <EmptyState icon="movie" message="Phim này chưa có tập nào." />
      ) : (
        <div className="flex flex-col gap-sm">
          {episodes.map((episode, index) => (
            <div
              key={episode._id}
              className="flex items-center gap-md rounded-xl bg-surface-container-high px-md py-base"
            >
              <div className="flex flex-col">
                <button
                  type="button"
                  aria-label="Di chuyển lên"
                  disabled={index === 0 || orderMutation.isPending}
                  onClick={() => moveEpisode(episode, -1)}
                  className="material-symbols-outlined text-[20px] leading-none text-on-surface-variant hover:text-on-surface disabled:opacity-30"
                >
                  keyboard_arrow_up
                </button>
                <button
                  type="button"
                  aria-label="Di chuyển xuống"
                  disabled={index === episodes.length - 1 || orderMutation.isPending}
                  onClick={() => moveEpisode(episode, 1)}
                  className="material-symbols-outlined text-[20px] leading-none text-on-surface-variant hover:text-on-surface disabled:opacity-30"
                >
                  keyboard_arrow_down
                </button>
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-body-md font-bold text-on-surface">
                  Tập {episode.episodeNumber} — {episode.title}
                </p>
                <p className="text-label-md text-on-surface-variant">
                  {episode.duration || 'Chưa có thời lượng'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => togglePublish(episode)}
                disabled={updateMutation.isPending && updateMutation.variables?.id === episode._id}
                className={`whitespace-nowrap rounded-full px-md py-1 text-label-md font-bold transition-colors ${
                  episode.isPublished
                    ? 'bg-primary/20 text-primary'
                    : 'bg-white/10 text-on-surface-variant'
                }`}
              >
                {episode.isPublished ? 'Công khai' : 'Đã ẩn'}
              </button>

              <button
                type="button"
                onClick={() => openEditForm(episode)}
                className="text-label-md font-bold text-on-surface hover:underline"
              >
                Sửa
              </button>
              <button
                type="button"
                onClick={() => setDeleteTarget(episode)}
                className="text-label-md font-bold text-error hover:underline"
              >
                Xoá
              </button>
            </div>
          ))}
        </div>
      )}

      <EpisodeFormDialog
        open={formTarget !== null}
        mode={formTarget === 'new' ? 'create' : 'edit'}
        initialEpisode={formTarget && formTarget !== 'new' ? formTarget : undefined}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
        submitError={formError}
        onSubmit={handleFormSubmit}
        onCancel={closeForm}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Xoá tập phim"
        message={
          deleteTarget
            ? `Xoá vĩnh viễn "Tập ${deleteTarget.episodeNumber} — ${deleteTarget.title}"? Không thể hoàn tác.`
            : ''
        }
        confirmLabel="Xoá"
        isLoading={deleteMutation.isPending}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </section>
  );
}
