'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import {
  actorsQueryOptions,
  categoriesQueryOptions,
  countriesQueryOptions,
  directorsQueryOptions,
} from '@/lib/query/options';
import { FILM_FORM_DEFAULTS, filmFormSchema, type FilmFormValues } from '@/lib/validation/film';
import type { CreateFilmInput, FilmDetail, UpdateFilmInput } from '@/lib/types/film';
import { Select } from './Select';
import { SearchableMultiSelect, type SelectableItem } from './SearchableMultiSelect';

const FORMAT_OPTIONS = [
  { value: 'single', label: 'Phim lẻ' },
  { value: 'series', label: 'Phim bộ' },
];

const STATUS_OPTIONS = [
  { value: 'ongoing', label: 'Đang chiếu' },
  { value: 'completed', label: 'Hoàn thành' },
];

/** `FilmDetail` (chi tiết, dùng khi Edit) -> giá trị mặc định của form. */
function filmToFormValues(film: FilmDetail): FilmFormValues {
  return {
    title: film.title,
    originalTitle: film.originalTitle ?? '',
    description: film.description ?? '',
    posterUrl: film.posterUrl ?? '',
    thumbUrl: film.thumbUrl ?? '',
    trailerUrl: film.trailerUrl ?? '',
    category: film.category,
    episodeCurrent: film.episodeCurrent ?? '',
    episodeTotal: film.episodeTotal ?? '',
    duration: film.duration ?? '',
    quality: film.quality ?? '',
    language: film.language ?? '',
    releaseYear: film.releaseYear ? String(film.releaseYear) : '',
    status: film.status,
    isPublished: film.isPublished,
    countries: film.countries.map((c) => ({ _id: c._id, name: c.name })),
    directors: film.directors.map((d) => ({ _id: d._id, name: d.name })),
    actors: film.actors.map((a) => ({ _id: a._id, name: a.name })),
    categories: film.categories.map((c) => ({ _id: c._id, name: c.name })),
  };
}

/** Form -> body gửi lên `POST /films` / `PATCH /films/:id`. Không gửi `episodes` — xem ghi chú
 * `filmFormSchema`. Chuỗi rỗng ('') cho field optional -> `undefined` (không gửi field lên BE thay
 * vì gửi chuỗi rỗng làm mất giá trị cũ khi Edit). */
function formValuesToBody(values: FilmFormValues): CreateFilmInput {
  return {
    title: values.title.trim(),
    originalTitle: values.originalTitle?.trim() || undefined,
    description: values.description?.trim() || undefined,
    posterUrl: values.posterUrl?.trim() || undefined,
    thumbUrl: values.thumbUrl?.trim() || undefined,
    trailerUrl: values.trailerUrl?.trim() || undefined,
    category: values.category,
    episodeCurrent: values.episodeCurrent?.trim() || undefined,
    episodeTotal: values.episodeTotal?.trim() || undefined,
    duration: values.duration?.trim() || undefined,
    quality: values.quality?.trim() || undefined,
    language: values.language?.trim() || undefined,
    releaseYear: values.releaseYear ? Number(values.releaseYear) : undefined,
    status: values.status,
    isPublished: values.isPublished,
    countries: values.countries.map((c) => c._id),
    directors: values.directors.map((d) => d._id),
    actors: values.actors.map((a) => a._id),
    categories: values.categories.map((c) => c._id),
  };
}

/**
 * MovieForm — form dùng chung Create + Edit phim (Phase 19B.2). KHÔNG có field `episodes` (xem
 * `lib/validation/film.ts`). KHÔNG có upload file (poster/thumb/trailer là URL text) — đúng BLOCKER
 * đã báo cáo ở Phase 19B (chưa có `UploadModule`).
 *
 * `mode='create'`: submit gọi `onSubmit(CreateFilmInput)`. `mode='edit'`: submit gọi
 * `onSubmit(UpdateFilmInput)` — cùng shape (`UpdateFilmInput = Partial<Omit<CreateFilmInput,
 * 'episodes'>>`) nên dùng chung 1 hàm map, khác biệt duy nhất là nơi gọi (`onSubmit` prop) quyết
 * định gọi API create hay update.
 */
export function MovieForm({
  mode,
  initialFilm,
  onSubmit,
  isSubmitting,
  submitError,
}: {
  mode: 'create' | 'edit';
  initialFilm?: FilmDetail;
  onSubmit: (body: CreateFilmInput | UpdateFilmInput) => void;
  isSubmitting: boolean;
  submitError: string | null;
}) {
  const router = useRouter();

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FilmFormValues>({
    resolver: zodResolver(filmFormSchema),
    defaultValues: initialFilm ? filmToFormValues(initialFilm) : FILM_FORM_DEFAULTS,
  });

  const submit = (values: FilmFormValues) => onSubmit(formValuesToBody(values));

  // Country/Category: danh sách trần không phân trang (audit Phase 19B) — lọc client-side theo
  // ô tìm kiếm, không cần debounce/gọi API lại.
  const countriesQuery = useQuery(countriesQueryOptions.list());
  const categoriesQuery = useQuery(categoriesQueryOptions.list());
  const [countrySearch, setCountrySearch] = useState('');
  const [categorySearch, setCategorySearch] = useState('');
  const countryOptions: SelectableItem[] = (countriesQuery.data ?? [])
    .filter((c) => c.name.toLowerCase().includes(countrySearch.toLowerCase()))
    .map((c) => ({ _id: c._id, name: c.name }));
  const categoryOptions: SelectableItem[] = (categoriesQuery.data ?? [])
    .filter((c) => c.name.toLowerCase().includes(categorySearch.toLowerCase()))
    .map((c) => ({ _id: c._id, name: c.name }));

  // Director/Actor: có phân trang + `search` ở backend (audit Phase 19B) — gọi API thật theo từ
  // khoá đã debounce, giới hạn 20 kết quả mỗi lần gõ.
  const [directorSearch, setDirectorSearch] = useState('');
  const [actorSearch, setActorSearch] = useState('');
  const debouncedDirectorSearch = useDebouncedValue(directorSearch);
  const debouncedActorSearch = useDebouncedValue(actorSearch);
  const directorsQuery = useQuery(
    directorsQueryOptions.list({ search: debouncedDirectorSearch || undefined, limit: 20 }),
  );
  const actorsQuery = useQuery(
    actorsQueryOptions.list({ search: debouncedActorSearch || undefined, limit: 20 }),
  );
  const directorOptions: SelectableItem[] = (directorsQuery.data?.items ?? []).map((d) => ({
    _id: d._id,
    name: d.name,
  }));
  const actorOptions: SelectableItem[] = (actorsQuery.data?.items ?? []).map((a) => ({
    _id: a._id,
    name: a.name,
  }));

  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="flex flex-col gap-lg">
      <section className="flex flex-col gap-md rounded-2xl bg-surface-container p-lg">
        <h2 className="text-headline-md font-headline-md text-on-surface">Thông tin cơ bản</h2>
        <Input label="Tên phim" error={errors.title?.message} {...register('title')} />
        <Input
          label="Tên gốc (tuỳ chọn)"
          error={errors.originalTitle?.message}
          {...register('originalTitle')}
        />
        <div className="flex flex-col gap-xs">
          <label
            htmlFor="film-description"
            className="text-label-md font-label-md text-on-surface-variant"
          >
            Mô tả
          </label>
          <textarea
            id="film-description"
            rows={4}
            {...register('description')}
            className="bg-surface-container-high border border-transparent rounded-xl px-md py-base text-body-md text-on-surface outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          />
        </div>
      </section>

      <section className="flex flex-col gap-md rounded-2xl bg-surface-container p-lg">
        <h2 className="text-headline-md font-headline-md text-on-surface">
          Hình ảnh &amp; Trailer
        </h2>
        <p className="text-label-md text-on-surface-variant">
          Backend chưa hỗ trợ upload file — nhập URL đã host sẵn (xem BLOCKER Phase 19B).
        </p>
        <Input label="URL Poster" error={errors.posterUrl?.message} {...register('posterUrl')} />
        <Input label="URL Thumbnail" error={errors.thumbUrl?.message} {...register('thumbUrl')} />
        <Input label="URL Trailer" error={errors.trailerUrl?.message} {...register('trailerUrl')} />
      </section>

      <section className="flex flex-col gap-md rounded-2xl bg-surface-container p-lg">
        <h2 className="text-headline-md font-headline-md text-on-surface">Phân loại</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
          <Controller
            control={control}
            name="category"
            render={({ field }) => (
              <Select
                label="Loại phim"
                options={FORMAT_OPTIONS}
                includeEmptyOption={false}
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
          <Controller
            control={control}
            name="status"
            render={({ field }) => (
              <Select
                label="Trạng thái"
                options={STATUS_OPTIONS}
                includeEmptyOption={false}
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
          <Input
            label="Năm phát hành"
            inputMode="numeric"
            error={errors.releaseYear?.message}
            {...register('releaseYear')}
          />
          <Input label="Thời lượng" {...register('duration')} />
          <Input label="Chất lượng (vd: FHD)" {...register('quality')} />
          <Input label="Ngôn ngữ (vd: Vietsub)" {...register('language')} />
          <Input label="Tập hiện tại (vd: Full)" {...register('episodeCurrent')} />
          <Input label="Tổng số tập (vd: 12)" {...register('episodeTotal')} />
        </div>
        <label className="flex items-center gap-sm text-body-md text-on-surface">
          <input type="checkbox" className="h-5 w-5" {...register('isPublished')} />
          Hiển thị công khai (bỏ chọn để ẩn phim khỏi trang người dùng)
        </label>
      </section>

      <section className="flex flex-col gap-md rounded-2xl bg-surface-container p-lg">
        <h2 className="text-headline-md font-headline-md text-on-surface">Liên quan</h2>
        <Controller
          control={control}
          name="countries"
          render={({ field }) => (
            <SearchableMultiSelect
              label="Quốc gia"
              selected={field.value}
              onAdd={(item) => field.onChange([...field.value, item])}
              onRemove={(id) => field.onChange(field.value.filter((i) => i._id !== id))}
              searchValue={countrySearch}
              onSearchChange={setCountrySearch}
              options={countryOptions}
              isLoading={countriesQuery.isLoading}
            />
          )}
        />
        <Controller
          control={control}
          name="categories"
          render={({ field }) => (
            <SearchableMultiSelect
              label="Thể loại"
              selected={field.value}
              onAdd={(item) => field.onChange([...field.value, item])}
              onRemove={(id) => field.onChange(field.value.filter((i) => i._id !== id))}
              searchValue={categorySearch}
              onSearchChange={setCategorySearch}
              options={categoryOptions}
              isLoading={categoriesQuery.isLoading}
            />
          )}
        />
        <Controller
          control={control}
          name="directors"
          render={({ field }) => (
            <SearchableMultiSelect
              label="Đạo diễn"
              selected={field.value}
              onAdd={(item) => field.onChange([...field.value, item])}
              onRemove={(id) => field.onChange(field.value.filter((i) => i._id !== id))}
              searchValue={directorSearch}
              onSearchChange={setDirectorSearch}
              options={directorOptions}
              isLoading={directorsQuery.isLoading}
            />
          )}
        />
        <Controller
          control={control}
          name="actors"
          render={({ field }) => (
            <SearchableMultiSelect
              label="Diễn viên"
              selected={field.value}
              onAdd={(item) => field.onChange([...field.value, item])}
              onRemove={(id) => field.onChange(field.value.filter((i) => i._id !== id))}
              searchValue={actorSearch}
              onSearchChange={setActorSearch}
              options={actorOptions}
              isLoading={actorsQuery.isLoading}
            />
          )}
        />
      </section>

      {submitError ? (
        <p role="alert" className="text-label-md text-error">
          {submitError}
        </p>
      ) : null}

      <div className="flex justify-end gap-sm">
        <Button variant="secondary" type="button" onClick={() => router.push('/admin/phim')}>
          Huỷ
        </Button>
        <Button type="submit" variant="primary" disabled={isSubmitting}>
          {isSubmitting ? 'Đang lưu...' : mode === 'create' ? 'Tạo phim' : 'Lưu thay đổi'}
        </Button>
      </div>
    </form>
  );
}
