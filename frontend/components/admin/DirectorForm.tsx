'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  DIRECTOR_FORM_DEFAULTS,
  directorFormSchema,
  type DirectorFormValues,
} from '@/lib/validation/director';
import type {
  CreateDirectorInput,
  DirectorDetail,
  UpdateDirectorInput,
} from '@/lib/types/director';

function directorToFormValues(director: DirectorDetail): DirectorFormValues {
  return {
    name: director.name,
    avatar: director.avatar ?? '',
    bio: director.bio ?? '',
    birthday: director.birthday ?? '',
    nationality: director.nationality ?? '',
  };
}

function formValuesToBody(values: DirectorFormValues): CreateDirectorInput {
  return {
    name: values.name.trim(),
    avatar: values.avatar?.trim() || undefined,
    bio: values.bio?.trim() || undefined,
    birthday: values.birthday?.trim() || undefined,
    nationality: values.nationality?.trim() || undefined,
  };
}

/** DirectorForm — form dùng chung Create + Edit đạo diễn (Phase 19B.6). Cùng cấu trúc `ActorForm`
 * (schema backend giống hệt nhau) — không upload file, sửa tên đổi slug. */
export function DirectorForm({
  mode,
  initialDirector,
  onSubmit,
  isSubmitting,
  submitError,
}: {
  mode: 'create' | 'edit';
  initialDirector?: DirectorDetail;
  onSubmit: (body: CreateDirectorInput | UpdateDirectorInput) => void;
  isSubmitting: boolean;
  submitError: string | null;
}) {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DirectorFormValues>({
    resolver: zodResolver(directorFormSchema),
    defaultValues: initialDirector ? directorToFormValues(initialDirector) : DIRECTOR_FORM_DEFAULTS,
  });

  const submit = (values: DirectorFormValues) => onSubmit(formValuesToBody(values));

  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="flex flex-col gap-lg">
      <section className="flex flex-col gap-md rounded-2xl bg-surface-container p-lg">
        <Input label="Tên đạo diễn" error={errors.name?.message} {...register('name')} />
        <Input label="URL Avatar" error={errors.avatar?.message} {...register('avatar')} />
        <div className="flex flex-col gap-xs">
          <label
            htmlFor="director-bio"
            className="text-label-md font-label-md text-on-surface-variant"
          >
            Tiểu sử
          </label>
          <textarea
            id="director-bio"
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
            Lưu ý: đổi tên sẽ đổi cả đường dẫn (slug) công khai của đạo diễn này.
          </p>
        ) : null}
      </section>

      {submitError ? (
        <p role="alert" className="text-label-md text-error">
          {submitError}
        </p>
      ) : null}

      <div className="flex justify-end gap-sm">
        <Button variant="secondary" type="button" onClick={() => router.push('/admin/dao-dien')}>
          Huỷ
        </Button>
        <Button type="submit" variant="primary" disabled={isSubmitting}>
          {isSubmitting ? 'Đang lưu...' : mode === 'create' ? 'Tạo đạo diễn' : 'Lưu thay đổi'}
        </Button>
      </div>
    </form>
  );
}
