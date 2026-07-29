'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  COUNTRY_FORM_DEFAULTS,
  countryFormSchema,
  type CountryFormValues,
} from '@/lib/validation/country';
import type { Country, CreateCountryInput, UpdateCountryInput } from '@/lib/types/country';

function countryToFormValues(country: Country): CountryFormValues {
  return { name: country.name, code: country.code ?? '' };
}

function formValuesToBody(values: CountryFormValues): CreateCountryInput {
  return { name: values.name.trim(), code: values.code?.trim() || undefined };
}

/** CountryForm — form dùng chung Create + Edit quốc gia (Phase 19B.4). Chỉ 2 field
 * (`CreateCountryDto` thật). Lưu ý: `countries.service.ts`'s `update()` tự suy lại `slug` từ
 * `name` mỗi khi sửa tên (khác `categories` — không tự đổi slug khi update) — sửa tên quốc gia sẽ
 * đổi URL `/quoc-gia/[slug]` công khai, hành vi backend có sẵn, không thuộc phạm vi sửa ở đây. */
export function CountryForm({
  mode,
  initialCountry,
  onSubmit,
  isSubmitting,
  submitError,
}: {
  mode: 'create' | 'edit';
  initialCountry?: Country;
  onSubmit: (body: CreateCountryInput | UpdateCountryInput) => void;
  isSubmitting: boolean;
  submitError: string | null;
}) {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CountryFormValues>({
    resolver: zodResolver(countryFormSchema),
    defaultValues: initialCountry ? countryToFormValues(initialCountry) : COUNTRY_FORM_DEFAULTS,
  });

  const submit = (values: CountryFormValues) => onSubmit(formValuesToBody(values));

  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="flex flex-col gap-lg">
      <section className="flex flex-col gap-md rounded-2xl bg-surface-container p-lg">
        <Input label="Tên quốc gia" error={errors.name?.message} {...register('name')} />
        <Input
          label="Mã quốc gia (tuỳ chọn, vd: KR)"
          error={errors.code?.message}
          {...register('code')}
        />
        {mode === 'edit' ? (
          <p className="text-label-md text-on-surface-variant">
            Lưu ý: đổi tên sẽ đổi cả đường dẫn (slug) công khai của quốc gia này.
          </p>
        ) : null}
      </section>

      {submitError ? (
        <p role="alert" className="text-label-md text-error">
          {submitError}
        </p>
      ) : null}

      <div className="flex justify-end gap-sm">
        <Button variant="secondary" type="button" onClick={() => router.push('/admin/quoc-gia')}>
          Huỷ
        </Button>
        <Button type="submit" variant="primary" disabled={isSubmitting}>
          {isSubmitting ? 'Đang lưu...' : mode === 'create' ? 'Tạo quốc gia' : 'Lưu thay đổi'}
        </Button>
      </div>
    </form>
  );
}
