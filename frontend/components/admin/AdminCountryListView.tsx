'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { SkeletonBlock } from '@/components/ui/SkeletonBlock';
import { useNotification } from '@/hooks/useNotification';
import { ApiRequestError } from '@/lib/api/client';
import { useDeleteCountryMutation } from '@/lib/query/mutations';
import { countriesQueryOptions } from '@/lib/query/options';
import type { Country } from '@/lib/types/country';
import { AdminTable } from './AdminTable';
import { ConfirmDialog } from './ConfirmDialog';

const TABLE_COLUMNS = ['Tên quốc gia', 'Slug', 'Mã', 'Thao tác'];

/** AdminCountryListView — Phase 19B.4. `GET /countries` trả mảng trần, không phân trang/filter
 * (khác `categories`/`films`) — search chỉ cần lọc client-side trên tập đã tải hết 1 lần. */
export function AdminCountryListView() {
  const notify = useNotification();
  const deleteMutation = useDeleteCountryMutation();
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Country | null>(null);

  const { data, isLoading, isError, refetch } = useQuery(countriesQueryOptions.list());
  const countries = data ?? [];
  const filtered = countries.filter((country) =>
    country.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="flex flex-col gap-lg">
      <div className="flex items-start justify-between gap-md">
        <div>
          <h1 className="text-headline-lg font-headline-lg text-on-surface">Quản lý quốc gia</h1>
          <p className="text-body-md text-on-surface-variant">{countries.length} quốc gia</p>
        </div>
        <Button href="/admin/quoc-gia/moi" variant="primary" className="shrink-0">
          <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
            add
          </span>
          Thêm quốc gia
        </Button>
      </div>

      <input
        type="search"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Tìm theo tên quốc gia..."
        aria-label="Tìm theo tên quốc gia"
        className="w-full sm:max-w-[28rem] bg-surface-container-high border border-transparent rounded-xl py-base px-md text-body-md text-on-surface outline-none focus:ring-2 focus:ring-primary/50 transition-all"
      />

      {isError ? (
        <ErrorState message="Không tải được danh sách quốc gia." onRetry={() => refetch()} />
      ) : isLoading ? (
        <div className="flex flex-col gap-sm" aria-hidden="true">
          {Array.from({ length: 5 }).map((_, index) => (
            <SkeletonBlock key={index} className="h-14 rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon="public" message="Không tìm thấy quốc gia." />
      ) : (
        <>
          <div className="hidden lg:block">
            <AdminTable columns={TABLE_COLUMNS}>
              {filtered.map((country) => (
                <tr key={country._id} className="hover:bg-white/5 transition-colors duration-200">
                  <td className="px-md py-sm font-bold text-on-surface">{country.name}</td>
                  <td className="px-md py-sm text-on-surface-variant">{country.slug}</td>
                  <td className="px-md py-sm text-on-surface-variant">{country.code ?? '—'}</td>
                  <td className="px-md py-sm">
                    <div className="flex items-center gap-sm">
                      <Link
                        href={`/admin/quoc-gia/${country.slug}`}
                        className="text-primary hover:underline text-label-md font-bold"
                      >
                        Sửa
                      </Link>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(country)}
                        className="text-error hover:underline text-label-md font-bold"
                      >
                        Xoá
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </AdminTable>
          </div>

          <div className="flex flex-col gap-sm lg:hidden">
            {filtered.map((country) => (
              <div
                key={country._id}
                className="flex flex-col gap-1 rounded-xl border border-white/10 bg-surface-container p-md"
              >
                <p className="font-bold text-on-surface">{country.name}</p>
                <p className="text-label-md text-on-surface-variant">
                  {country.slug}
                  {country.code ? ` • ${country.code}` : ''}
                </p>
                <div className="flex items-center gap-md mt-1">
                  <Link
                    href={`/admin/quoc-gia/${country.slug}`}
                    className="text-primary hover:underline text-label-md font-bold"
                  >
                    Sửa
                  </Link>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(country)}
                    className="text-error hover:underline text-label-md font-bold"
                  >
                    Xoá
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Xoá quốc gia"
        message={
          deleteTarget
            ? `Xoá vĩnh viễn "${deleteTarget.name}"? Không thể hoàn tác. Backend không kiểm tra phim đang dùng quốc gia này trước khi xoá (khác thể loại) — phim liên quan sẽ mất tham chiếu.`
            : ''
        }
        confirmLabel="Xoá"
        isLoading={deleteMutation.isPending}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (!deleteTarget) return;
          deleteMutation.mutate(
            { id: deleteTarget._id },
            {
              onSuccess: () => {
                notify.success(`Đã xoá "${deleteTarget.name}".`);
                setDeleteTarget(null);
              },
              onError: (error) => {
                notify.error(
                  error instanceof ApiRequestError ? error.message : 'Xoá quốc gia thất bại.',
                );
                setDeleteTarget(null);
              },
            },
          );
        }}
      />
    </div>
  );
}
