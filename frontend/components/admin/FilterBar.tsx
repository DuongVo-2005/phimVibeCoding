'use client';

import { useQuery } from '@tanstack/react-query';
import { categoriesQueryOptions, countriesQueryOptions } from '@/lib/query/options';
import { Select } from './Select';

export interface MovieFilterValues {
  status: string;
  category: string;
  country: string;
  year: string;
}

export const EMPTY_MOVIE_FILTER: MovieFilterValues = {
  status: '',
  category: '',
  country: '',
  year: '',
};

/** Khớp `FilmStatus` — backend/src/common/constants/index.ts. */
const STATUS_OPTIONS = [
  { value: 'ongoing', label: 'Đang chiếu' },
  { value: 'completed', label: 'Hoàn thành' },
];

/**
 * FilterBar — Status/Category/Country/Year cho Admin Movie List (Phase 19B.1). Category/Country
 * lấy danh sách thật qua `categoriesQueryOptions`/`countriesQueryOptions` (đã có sẵn từ Phase
 * 11.3A, trả mảng trần không phân trang) — không hardcode danh sách. Year dùng input số thay vì
 * select cố định: backend không có endpoint liệt kê các năm có phim thật, hardcode 1 danh sách năm
 * sẽ là dữ liệu bịa, không khớp yêu cầu "không mock data" đã áp dụng xuyên suốt dự án.
 */
export function FilterBar({
  value,
  onChange,
}: {
  value: MovieFilterValues;
  onChange: (value: MovieFilterValues) => void;
}) {
  const categoriesQuery = useQuery(categoriesQueryOptions.list());
  const countriesQuery = useQuery(countriesQueryOptions.list());

  const categoryOptions = (categoriesQuery.data ?? []).map((category) => ({
    value: category.slug,
    label: category.name,
  }));
  const countryOptions = (countriesQuery.data ?? []).map((country) => ({
    value: country.slug,
    label: country.name,
  }));

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-sm">
      <Select
        label="Trạng thái"
        value={value.status}
        onChange={(event) => onChange({ ...value, status: event.target.value })}
        options={STATUS_OPTIONS}
      />
      <Select
        label="Thể loại"
        value={value.category}
        onChange={(event) => onChange({ ...value, category: event.target.value })}
        options={categoryOptions}
        disabled={categoriesQuery.isLoading}
      />
      <Select
        label="Quốc gia"
        value={value.country}
        onChange={(event) => onChange({ ...value, country: event.target.value })}
        options={countryOptions}
        disabled={countriesQuery.isLoading}
      />
      <div className="flex flex-col gap-xs">
        <label
          htmlFor="filter-year"
          className="text-label-md font-label-md text-on-surface-variant"
        >
          Năm
        </label>
        <input
          id="filter-year"
          type="number"
          inputMode="numeric"
          placeholder="VD: 2024"
          value={value.year}
          onChange={(event) => onChange({ ...value, year: event.target.value })}
          className="bg-surface-container-high border border-transparent rounded-xl px-md py-base text-body-md text-on-surface outline-none focus:ring-2 focus:ring-primary/50 transition-all"
        />
      </div>
    </div>
  );
}
