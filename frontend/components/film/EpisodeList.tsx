import Image from 'next/image';

export interface EpisodeItem {
  id: string;
  number: number;
  title: string;
  /** Phase 10.4 (`moviedentail.html`) dùng làm mô tả tập; Phase 10.5 (`watchmovie.html`) không có. */
  description?: string;
  duration: string;
  /** Chỉ dùng ở `layout="grid"` (Phase 10.4) — tập chưa mở, hiện icon khoá + mờ. */
  locked?: boolean;
  /** Chỉ dùng ở `layout="list"` (Phase 10.5) — tập đang xem, hiện icon "equalizer" + viền primary. */
  active?: boolean;
  thumbnailSrc: string;
}

/**
 * EpisodeList — dùng chung cho 2 design khác nhau qua prop `layout` (mặc định `"grid"`, giữ đúng
 * hành vi Phase 10.4, không đổi khi không truyền prop mới):
 * - `"grid"` (`moviedentail.html`): desktop lưới thẻ 16:9 + mô tả, mobile danh sách hàng ngang +
 *   icon khoá cho tập chưa mở (`locked`).
 * - `"list"` (`watchmovie.html`, D5): 1 danh sách hàng dọc dùng chung mọi breakpoint (design không
 *   có bản lưới desktop cho trang xem phim — sidebar tập là danh sách cuộn dọc kể cả ở desktop),
 *   tập đang xem (`active`) có viền trái primary + icon "equalizer" thay vì khoá/phát.
 *
 * `locked`/`description` chỉ là UI tĩnh mô phỏng đúng design — KHÔNG có logic mở khoá/quyền thật.
 */
export function EpisodeList({
  episodes,
  layout = 'grid',
}: {
  episodes: EpisodeItem[];
  layout?: 'grid' | 'list';
}) {
  if (layout === 'list') {
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

  return (
    <section>
      <div className="flex items-center justify-between mb-lg">
        <h2 className="text-headline-lg font-headline-lg text-on-surface">Danh sách tập</h2>
        <span className="text-on-surface-variant text-body-md font-body-md">
          {episodes.length} Tập
        </span>
      </div>

      {/* Desktop: lưới thẻ */}
      <div className="hidden md:grid grid-cols-2 lg:grid-cols-4 gap-md">
        {episodes.map((episode) => (
          <div key={episode.id} className="group cursor-pointer">
            <div className="relative aspect-video rounded-xl overflow-hidden mb-sm border border-white/5">
              <Image
                src={episode.thumbnailSrc}
                alt={episode.title}
                fill
                sizes="(max-width: 1024px) 50vw, 25vw"
                className="object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span
                  className="material-symbols-outlined text-primary text-5xl"
                  aria-hidden="true"
                >
                  play_circle
                </span>
              </div>
              <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 rounded text-xs text-on-surface">
                {episode.duration}
              </div>
            </div>
            <h3 className="text-label-md font-bold text-on-surface group-hover:text-primary transition-colors">
              {episode.title}
            </h3>
            <p className="text-label-md text-on-surface-variant line-clamp-1">
              {episode.description}
            </p>
          </div>
        ))}
      </div>

      {/* Mobile: danh sách hàng ngang */}
      <div className="md:hidden flex flex-col gap-4">
        {episodes.map((episode) => (
          <div
            key={episode.id}
            className={
              episode.locked
                ? 'flex gap-4 p-3 bg-surface-container/40 rounded-2xl border border-white/5 opacity-60'
                : 'flex gap-4 p-3 bg-surface-container/40 rounded-2xl border border-white/5'
            }
          >
            <div className="relative w-32 aspect-video rounded-xl overflow-hidden shrink-0">
              <Image
                src={episode.thumbnailSrc}
                alt={episode.title}
                fill
                sizes="128px"
                className="object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <span className="material-symbols-outlined text-white text-3xl" aria-hidden="true">
                  {episode.locked ? 'lock' : 'play_circle'}
                </span>
              </div>
            </div>
            <div className="flex flex-col justify-center gap-1">
              <span
                className={
                  episode.locked ? 'text-xs text-on-surface-variant' : 'text-xs text-primary'
                }
              >
                TẬP {episode.number}
              </span>
              <h4
                className={
                  episode.locked
                    ? 'text-sm text-on-surface-variant line-clamp-1'
                    : 'text-sm text-on-surface line-clamp-1'
                }
              >
                {episode.title}
              </h4>
              <span className="text-xs text-on-surface-variant">{episode.duration}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
