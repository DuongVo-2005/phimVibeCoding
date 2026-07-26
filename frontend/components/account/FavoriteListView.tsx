'use client';

import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Pagination } from '@/components/ui/Pagination';
import { MovieCard } from '@/components/film/MovieCard';
import { MovieCardSkeleton } from '@/components/film/MovieCardSkeleton';
import type { FavoritesQueryParams } from '@/lib/api/favorites';
import { useFavoriteMutation } from '@/lib/query/mutations';
import { favoritesQueryOptions } from '@/lib/query/options';
import type { FilmSummary } from '@/lib/types/film';
import { useNotification } from '@/hooks/useNotification';

const PAGE_LIMIT = 12;

/**
 * FavoriteListView — nội dung trang `/user/yeu-thich` (Phase 17B.1). Chỉ danh sách phim
 * (`targetType: 'film'`) — trang này không quản lý diễn viên yêu thích (`Favorite.target` cũng có
 * thể là `ActorSummary`, ngoài phạm vi tính năng "Favorite List" phim).
 *
 * Tái dùng 100% hạ tầng đã có, KHÔNG tạo API layer mới: `favoritesApi`/`favoritesQueryOptions`
 * (đọc), `useFavoriteMutation` (xoá — cùng mutation đã dùng cho nút tim ở Movie Detail/Watch Page,
 * đã có optimistic update + rollback + `invalidateQueries` sẵn, xem `lib/query/mutations.ts`).
 * `MovieCard` tái dùng nguyên — KHÔNG tạo card riêng cho trang này.
 *
 * Giới hạn dữ liệu đã phát hiện khi audit (Proven, đọc `favorites.service.ts` thật): endpoint
 * `GET /favorites?targetType=film` resolve `target` bằng `filmModel.find()` KHÔNG `.populate()`
 * `categories` — field này trả về ObjectId thô, không phải `{_id,name,slug}`. Vì "không sửa
 * backend" nên KHÔNG truyền `genreLine` cho `MovieCard` ở trang này (tránh hiện text rác kiểu
 * "undefined, undefined") — chỉ dùng field vô hướng an toàn: title/slug/posterUrl/thumbUrl/
 * ratingAvg/ratingCount/quality.
 *
 * Nút xoá: overlay TÁCH BIỆT (sibling, không lồng trong `<Link>` của `MovieCard`) — nút bên trong
 * thẻ `<a>` là HTML không hợp lệ và sẽ kích hoạt cả 2 handler khi bấm. `stopPropagation`+
 * `preventDefault` chặn điều hướng của Link bên dưới khi bấm nút xoá. Luôn hiển thị (không
 * `opacity-0 group-hover`) — ẩn theo hover sẽ khiến người dùng chạm/bàn phím không tiếp cận được.
 */
export function FavoriteListView() {
  const { data: session } = useSession();
  const accessToken = session?.accessToken;
  const notify = useNotification();
  const mutation = useFavoriteMutation();
  const [page, setPage] = useState(1);

  const listParams: FavoritesQueryParams = { targetType: 'film', page, limit: PAGE_LIMIT };
  const { data, isLoading, isError, refetch } = useQuery(
    favoritesQueryOptions.mine(listParams, accessToken),
  );

  const handleRemove = (targetId: string, title: string) => {
    if (mutation.isPending || !accessToken) {
      return;
    }

    mutation.mutate(
      { targetType: 'film', targetId, isFavorited: true, listParams },
      {
        onSuccess: () => notify.success(`Đã bỏ "${title}" khỏi danh sách yêu thích.`),
        onError: () => notify.error('Không thể bỏ yêu thích, vui lòng thử lại.'),
      },
    );
  };

  if (isError) {
    return <ErrorState message="Không tải được danh sách yêu thích." onRetry={() => refetch()} />;
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-md">
        {Array.from({ length: PAGE_LIMIT }).map((_, index) => (
          <MovieCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  // `target` có thể null nếu phim gốc đã bị xoá hẳn — bỏ qua, không hiện thẻ vỡ.
  const items = (data?.items ?? []).filter(
    (favorite): favorite is typeof favorite & { target: FilmSummary } =>
      favorite.targetType === 'film' && favorite.target !== null,
  );

  if (items.length === 0) {
    return (
      <EmptyState
        icon="favorite"
        message="Chưa có phim yêu thích."
        subtitle="Khám phá và thêm phim bạn thích vào danh sách này."
      />
    );
  }

  return (
    <div className="flex flex-col gap-lg">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-md">
        {items.map((favorite) => {
          const film = favorite.target as FilmSummary;
          return (
            <div key={favorite._id} className="relative">
              <MovieCard
                title={film.title}
                href={`/phim/${film.slug}`}
                imageSrc={film.posterUrl ?? film.thumbUrl}
                rating={film.ratingCount > 0 ? film.ratingAvg.toFixed(1) : undefined}
                sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, (max-width: 1280px) 22vw, 18vw"
                showActions
                cornerBadge={
                  film.quality ? (
                    <Badge variant="primary" className="border-none">
                      {film.quality}
                    </Badge>
                  ) : undefined
                }
              />
              <button
                type="button"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  handleRemove(film._id, film.title);
                }}
                disabled={mutation.isPending}
                aria-label={`Bỏ "${film.title}" khỏi danh sách yêu thích`}
                className="absolute top-md left-md z-30 w-8 h-8 rounded-full bg-black/70 backdrop-blur flex items-center justify-center text-white shadow-lg transition-transform duration-300 ease-out hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
              >
                <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                  close
                </span>
              </button>
            </div>
          );
        })}
      </div>

      {data && data.meta.totalPages > 1 ? (
        <Pagination
          currentPage={data.meta.page}
          pages={[data.meta.page]}
          lastPage={data.meta.totalPages}
          onPageChange={setPage}
        />
      ) : null}
    </div>
  );
}
