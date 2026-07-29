'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ACTOR_FORM_DEFAULTS, actorFormSchema, type ActorFormValues } from '@/lib/validation/actor';
import type { ActorDetail, CreateActorInput, UpdateActorInput } from '@/lib/types/actor';

function actorToFormValues(actor: ActorDetail): ActorFormValues {
  return {
    name: actor.name,
    avatar: actor.avatar ?? '',
    bio: actor.bio ?? '',
    birthday: actor.birthday ?? '',
    nationality: actor.nationality ?? '',
  };
}

function formValuesToBody(values: ActorFormValues): CreateActorInput {
  return {
    name: values.name.trim(),
    avatar: values.avatar?.trim() || undefined,
    bio: values.bio?.trim() || undefined,
    birthday: values.birthday?.trim() || undefined,
    nationality: values.nationality?.trim() || undefined,
  };
}

/** ActorForm — form dùng chung Create + Edit diễn viên (Phase 19B.5). Không có upload file (avatar
 * là URL text) — đúng BLOCKER Phase 19B (chưa có UploadModule). Sửa tên sẽ đổi slug (cùng hành vi
 * `countries`/`actors.service.ts`'s `update()`), ghi chú như `CountryForm`. */
export function ActorForm({
  mode,
  initialActor,
  onSubmit,
  isSubmitting,
  submitError,
}: {
  mode: 'create' | 'edit';
  initialActor?: ActorDetail;
  onSubmit: (body: CreateActorInput | UpdateActorInput) => void;
  isSubmitting: boolean;
  submitError: string | null;
}) {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ActorFormValues>({
    resolver: zodResolver(actorFormSchema),
    defaultValues: initialActor ? actorToFormValues(initialActor) : ACTOR_FORM_DEFAULTS,
  });

  const submit = (values: ActorFormValues) => onSubmit(formValuesToBody(values));

  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="flex flex-col gap-lg">
      <section className="flex flex-col gap-md rounded-2xl bg-surface-container p-lg">
        <Input label="Tên diễn viên" error={errors.name?.message} {...register('name')} />
        <Input label="URL Avatar" error={errors.avatar?.message} {...register('avatar')} />
        <div className="flex flex-col gap-xs">
          <label
            htmlFor="actor-bio"
            className="text-label-md font-label-md text-on-surface-variant"
          >
            Tiểu sử
          </label>
          <textarea
            id="actor-bio"
            rows={4}
            {...register('bio')}
            className="bg-surface-container-high border border-transparent rounded-xl px-md py-base text-body-md text-on-surface outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          />
        </div>
        <Input
          label="Ngày sinh"
          type="date"
          error={errors.birthday?.message}
          {...register('birthday')}
        />
        <Input label="Quốc tịch" error={errors.nationality?.message} {...register('nationality')} />
        {mode === 'edit' ? (
          <p className="text-label-md text-on-surface-variant">
            Lưu ý: đổi tên sẽ đổi cả đường dẫn (slug) công khai của diễn viên này.
          </p>
        ) : null}
      </section>

      {submitError ? (
        <p role="alert" className="text-label-md text-error">
          {submitError}
        </p>
      ) : null}

      <div className="flex justify-end gap-sm">
        <Button variant="secondary" type="button" onClick={() => router.push('/admin/dien-vien')}>
          Huỷ
        </Button>
        <Button type="submit" variant="primary" disabled={isSubmitting}>
          {isSubmitting ? 'Đang lưu...' : mode === 'create' ? 'Tạo diễn viên' : 'Lưu thay đổi'}
        </Button>
      </div>
    </form>
  );
}
