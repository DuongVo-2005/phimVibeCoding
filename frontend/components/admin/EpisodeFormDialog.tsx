'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { CreateEpisodeInput, Episode, UpdateEpisodeInput } from '@/lib/types/episode';
import {
  EPISODE_FORM_DEFAULTS,
  episodeFormSchema,
  type EpisodeFormValues,
} from '@/lib/validation/episode';

function episodeToFormValues(episode: Episode): EpisodeFormValues {
  return {
    episodeNumber: episode.episodeNumber,
    title: episode.title,
    embedUrl: episode.embedUrl ?? '',
    m3u8Url: episode.m3u8Url ?? '',
    subtitleUrl: episode.subtitleUrl ?? '',
    duration: episode.duration ?? '',
    isPublished: episode.isPublished,
  };
}

function formValuesToBody(values: EpisodeFormValues): CreateEpisodeInput {
  return {
    episodeNumber: values.episodeNumber,
    title: values.title.trim(),
    embedUrl: values.embedUrl?.trim() || undefined,
    m3u8Url: values.m3u8Url?.trim() || undefined,
    subtitleUrl: values.subtitleUrl?.trim() || undefined,
    duration: values.duration?.trim() || undefined,
    isPublished: values.isPublished,
  };
}

/**
 * EpisodeFormDialog — form Add/Edit tập phim dùng chung (Phase 35). Không có Modal/Dialog dùng
 * chung nào ngoài `ConfirmDialog` (chỉ có message + 2 nút, không đủ cho form nhiều field) — tự
 * dựng theo đúng overlay/panel pattern đã có (Escape/click-outside để đóng, `role="dialog"`),
 * `max-w-[32rem]` + `max-h-[90vh] overflow-y-auto` (arbitrary value, KHÔNG dùng scale `sm/md/lg`
 * cho `max-w-*`/`max-h-*` — TECH-DEBT-001, xem `ConfirmDialog.tsx`).
 */
export function EpisodeFormDialog({
  open,
  mode,
  initialEpisode,
  isSubmitting,
  submitError,
  onSubmit,
  onCancel,
}: {
  open: boolean;
  mode: 'create' | 'edit';
  initialEpisode?: Episode;
  isSubmitting: boolean;
  submitError: string | null;
  onSubmit: (body: CreateEpisodeInput | UpdateEpisodeInput) => void;
  onCancel: () => void;
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EpisodeFormValues>({
    resolver: zodResolver(episodeFormSchema),
    defaultValues: initialEpisode ? episodeToFormValues(initialEpisode) : EPISODE_FORM_DEFAULTS,
  });

  useEffect(() => {
    if (!open) return;
    reset(initialEpisode ? episodeToFormValues(initialEpisode) : EPISODE_FORM_DEFAULTS);
  }, [open, initialEpisode, reset]);

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onCancel();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  const submit = (values: EpisodeFormValues) => onSubmit(formValuesToBody(values));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-md"
      onClick={onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="episode-form-dialog-title"
        onClick={(event) => event.stopPropagation()}
        className="flex w-full max-w-[32rem] max-h-[90vh] flex-col gap-md overflow-y-auto rounded-2xl bg-surface-container p-lg"
      >
        <h2
          id="episode-form-dialog-title"
          className="text-headline-md font-headline-md text-on-surface"
        >
          {mode === 'create' ? 'Thêm tập phim' : 'Sửa tập phim'}
        </h2>

        <form onSubmit={handleSubmit(submit)} noValidate className="flex flex-col gap-md">
          <div className="grid grid-cols-2 gap-md">
            <Input
              id="episode-episodeNumber"
              label="Số tập"
              type="number"
              min={1}
              error={errors.episodeNumber?.message}
              {...register('episodeNumber', { valueAsNumber: true })}
            />
            <Input
              id="episode-duration"
              label="Thời lượng"
              error={errors.duration?.message}
              {...register('duration')}
            />
          </div>
          <Input
            id="episode-title"
            label="Tên tập"
            error={errors.title?.message}
            {...register('title')}
          />
          <Input
            id="episode-embedUrl"
            label="Embed URL"
            error={errors.embedUrl?.message}
            {...register('embedUrl')}
          />
          <Input
            id="episode-m3u8Url"
            label="M3U8 URL"
            error={errors.m3u8Url?.message}
            {...register('m3u8Url')}
          />
          <Input
            id="episode-subtitleUrl"
            label="Subtitle URL"
            error={errors.subtitleUrl?.message}
            {...register('subtitleUrl')}
          />
          <label className="flex items-center gap-sm text-body-md text-on-surface">
            <input type="checkbox" className="h-5 w-5" {...register('isPublished')} />
            Hiển thị công khai (bỏ chọn để ẩn tập khỏi trang người dùng)
          </label>

          {submitError ? (
            <p role="alert" className="text-label-md text-error">
              {submitError}
            </p>
          ) : null}

          <div className="flex justify-end gap-sm mt-sm">
            <Button variant="secondary" type="button" onClick={onCancel} disabled={isSubmitting}>
              Huỷ
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? 'Đang lưu...' : mode === 'create' ? 'Thêm tập' : 'Lưu thay đổi'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
