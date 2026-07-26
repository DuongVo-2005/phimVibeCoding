/**
 * Phase 11.6B: `layout="grid"` (Movie Detail) tách khỏi `layout="list"`. Phase 13A (tiếp): `list`
 * (Watch Movie, `/xem-phim/[slug]`) cũng đã bỏ hẳn mock — cả 2 layout giờ dùng CHUNG 1 shape dữ
 * liệu thật từ backend (`slug`/`name`), không còn field bịa (`number`/`duration`/`description`/
 * `locked`/`thumbnailSrc`/`active` cứng).
 */
import Link from 'next/link';

/** `layout="grid"` — Movie Detail. Khớp `EpisodeItem` thật (`film.episodes[server].items[]`).
 * Phase 18: thêm `href` (dựng sẵn qua `buildWatchUrl()` ở `FilmDetailView.tsx`, cùng quy ước với
 * `ListEpisodeItem` bên dưới — KHÔNG hardcode URL ở đây) — trước đó mỗi ô tập chỉ là `<div
 * cursor-pointer>` KHÔNG có điều hướng thật, bấm vào không làm gì (audit Phase 18 phát hiện). */
export interface GridEpisodeItem {
  slug: string;
  name: string;
  href: string;
}

/**
 * `layout="list"` — Watch Movie. Cùng nguồn dữ liệu thật với `GridEpisodeItem` (`slug`/`name`),
 * cộng thêm 2 field do NƠI GỌI tự tính (không phải field backend):
 * - `active`: `episode.slug === currentEpisodeSlug` (tính ở `WatchMovieView`, không phải ở đây).
 * - `href`: URL điều hướng đã dựng sẵn qua `buildWatchUrl()` (không hardcode string URL ở đây).
 */
export interface ListEpisodeItem {
  slug: string;
  name: string;
  active?: boolean;
  href: string;
}

type EpisodeListProps =
  | { layout: 'list'; episodes: ListEpisodeItem[] }
  | { layout?: 'grid'; episodes: GridEpisodeItem[] };

/**
 * EpisodeList — dùng chung cho 2 design khác nhau qua prop `layout` (mặc định `"grid"`):
 * - `"grid"` (`moviedentail.html`): desktop lưới thẻ 16:9, mobile danh sách hàng ngang. Không có
 *   thumbnail/duration/mô tả riêng từng tập (backend không có) — dùng icon `play_circle` tĩnh.
 * - `"list"` (`watchmovie.html`, D5): 1 danh sách hàng dọc, tập đang xem (`active`) có viền trái
 *   primary + icon "equalizer" thay vì icon `play_circle` (không active). Mỗi hàng là `<Link>`
 *   điều hướng (KHÔNG phát video, KHÔNG tự đổi state — chỉ đổi URL, state resolve lại từ URL theo
 *   đúng kiến trúc Phase 13). Không có thumbnail/số tập/thời lượng riêng từng tập (backend không
 *   có) — chỉ hiện `name` + nhãn "Đang xem" khi active.
 */
export function EpisodeList(props: EpisodeListProps) {
  if (props.layout === 'list') {
    const { episodes } = props;

    return (
      <section>
        <div className="flex items-center justify-between mb-lg">
          <h2 className="text-headline-lg font-headline-lg text-on-surface">Danh sách tập</h2>
          <span className="text-on-surface-variant text-body-md font-body-md">
            {episodes.length} Tập
          </span>
        </div>

        {episodes.length === 0 ? (
          <p className="text-on-surface-variant text-body-md">Chưa có tập nào cho server này.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {episodes.map((episode) => (
              <Link
                key={episode.slug}
                href={episode.href}
                className={
                  episode.active
                    ? 'flex gap-4 p-3 bg-primary/5 rounded-xl border-l-4 border-primary'
                    : 'flex gap-4 p-3 rounded-xl border-l-4 border-transparent hover:bg-white/5 transition-colors'
                }
              >
                <div className="relative w-32 shrink-0 aspect-video rounded-lg overflow-hidden bg-surface-container-high flex items-center justify-center">
                  <span
                    className={
                      episode.active
                        ? 'material-symbols-outlined text-primary text-2xl'
                        : 'material-symbols-outlined text-on-surface-variant text-2xl'
                    }
                    aria-hidden="true"
                  >
                    {episode.active ? 'equalizer' : 'play_circle'}
                  </span>
                </div>
                <div className="flex flex-col justify-center gap-1">
                  {episode.active ? <span className="text-xs text-primary">Đang xem</span> : null}
                  <h4 className="text-sm text-on-surface line-clamp-1">{episode.name}</h4>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    );
  }

  const { episodes } = props;

  return (
    <section>
      <div className="flex items-center justify-between mb-lg">
        <h2 className="text-headline-lg font-headline-lg text-on-surface">Danh sách tập</h2>
        <span className="text-on-surface-variant text-body-md font-body-md">
          {episodes.length} Tập
        </span>
      </div>

      {/* Desktop: lưới thẻ — không có thumbnail/duration/mô tả riêng từng tập (backend không có),
          dùng icon play tĩnh thay ảnh. */}
      <div className="hidden md:grid grid-cols-2 lg:grid-cols-4 gap-md">
        {episodes.map((episode) => (
          <Link
            key={episode.slug}
            href={episode.href}
            className="group focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary rounded-xl"
          >
            <div className="relative aspect-video rounded-xl overflow-hidden mb-sm border border-white/5 bg-surface-container-high flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-5xl" aria-hidden="true">
                play_circle
              </span>
            </div>
            <h3 className="text-label-md font-bold text-on-surface group-hover:text-primary transition-colors">
              {episode.name}
            </h3>
          </Link>
        ))}
      </div>

      {/* Mobile: danh sách hàng ngang — không có thumbnail riêng từng tập (backend không có). */}
      <div className="md:hidden flex flex-col gap-4">
        {episodes.map((episode) => (
          <Link
            key={episode.slug}
            href={episode.href}
            className="flex gap-4 p-3 bg-surface-container/40 rounded-2xl border border-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
          >
            <div className="relative w-32 aspect-video rounded-xl overflow-hidden shrink-0 bg-surface-container-high flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-3xl" aria-hidden="true">
                play_circle
              </span>
            </div>
            <div className="flex flex-col justify-center gap-1">
              <span className="text-sm text-on-surface line-clamp-1">{episode.name}</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
