/**
 * Phase 11.6B: `layout="grid"` (Movie Detail, `/phim/[slug]`) đã tách riêng khỏi `layout="list"`
 * (Watch Movie, `/xem-phim/[slug]`, vẫn mock — ngoài phạm vi Phase 11.6) vì 2 layout giờ nhận 2
 * shape dữ liệu khác nhau hoàn toàn, không còn dùng chung 1 `EpisodeItem`.
 */
import Image from 'next/image';

/** `layout="list"` — Watch Movie, KHÔNG đổi (vẫn mock, đúng field đã dùng từ Phase 10.5). */
export interface ListEpisodeItem {
  id: string;
  number: number;
  title: string;
  duration: string;
  active?: boolean;
  thumbnailSrc: string;
}

/**
 * `layout="grid"` — Movie Detail. Khớp ĐÚNG `EpisodeItem` thật từ backend
 * (`film.episodes[server].items[]`, xem `lib/types/film.ts`) — CHỈ có `slug`/`name`. Backend
 * KHÔNG có `number`/`duration`/`description`/`locked`/`thumbnailSrc` cho từng tập — không tạo dữ
 * liệu giả, các field đó đã bị bỏ hẳn khỏi type và UI (Phase 10.4 cũ có nhưng sai model).
 */
export interface GridEpisodeItem {
  slug: string;
  name: string;
}

type EpisodeListProps =
  | { layout: 'list'; episodes: ListEpisodeItem[] }
  | { layout?: 'grid'; episodes: GridEpisodeItem[] };

/**
 * EpisodeList — dùng chung cho 2 design khác nhau qua prop `layout` (mặc định `"grid"`):
 * - `"grid"` (`moviedentail.html`): desktop lưới thẻ 16:9, mobile danh sách hàng ngang. Không còn
 *   thumbnail/duration/mô tả riêng từng tập (backend không có) — dùng icon `play_circle` tĩnh thay
 *   ảnh thumbnail.
 * - `"list"` (`watchmovie.html`, D5): 1 danh sách hàng dọc, tập đang xem (`active`) có viền trái
 *   primary + icon "equalizer". KHÔNG đổi so với trước Phase 11.6B.
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

        <div className="flex flex-col gap-3">
          {episodes.map((episode) => (
            <div
              key={episode.id}
              className={
                episode.active
                  ? 'flex gap-4 p-3 bg-primary/5 rounded-xl border-l-4 border-primary'
                  : 'flex gap-4 p-3 rounded-xl border-l-4 border-transparent hover:bg-white/5 transition-colors'
              }
            >
              <div className="relative w-32 shrink-0 aspect-video rounded-lg overflow-hidden group">
                <Image
                  src={episode.thumbnailSrc}
                  alt={episode.title}
                  fill
                  sizes="128px"
                  className={
                    episode.active
                      ? 'object-cover'
                      : 'object-cover grayscale group-hover:grayscale-0 transition-all'
                  }
                />
                {episode.active ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <span
                      className="material-symbols-outlined text-primary text-2xl"
                      aria-hidden="true"
                    >
                      equalizer
                    </span>
                  </div>
                ) : (
                  <div className="absolute bottom-1 right-1 bg-black/80 px-1.5 py-0.5 rounded text-xs text-on-surface">
                    {episode.duration}
                  </div>
                )}
              </div>
              <div className="flex flex-col justify-center gap-1">
                <span
                  className={
                    episode.active ? 'text-xs text-primary' : 'text-xs text-on-surface-variant'
                  }
                >
                  {episode.active ? 'Đang xem' : `TẬP ${episode.number}`}
                </span>
                <h4 className="text-sm text-on-surface line-clamp-1">{episode.title}</h4>
                <span className="text-xs text-on-surface-variant">{episode.duration}</span>
              </div>
            </div>
          ))}
        </div>
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
          <div key={episode.slug} className="group cursor-pointer">
            <div className="relative aspect-video rounded-xl overflow-hidden mb-sm border border-white/5 bg-surface-container-high flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-5xl" aria-hidden="true">
                play_circle
              </span>
            </div>
            <h3 className="text-label-md font-bold text-on-surface group-hover:text-primary transition-colors">
              {episode.name}
            </h3>
          </div>
        ))}
      </div>

      {/* Mobile: danh sách hàng ngang — không có thumbnail riêng từng tập (backend không có). */}
      <div className="md:hidden flex flex-col gap-4">
        {episodes.map((episode) => (
          <div
            key={episode.slug}
            className="flex gap-4 p-3 bg-surface-container/40 rounded-2xl border border-white/5"
          >
            <div className="relative w-32 aspect-video rounded-xl overflow-hidden shrink-0 bg-surface-container-high flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-3xl" aria-hidden="true">
                play_circle
              </span>
            </div>
            <div className="flex flex-col justify-center gap-1">
              <span className="text-sm text-on-surface line-clamp-1">{episode.name}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
