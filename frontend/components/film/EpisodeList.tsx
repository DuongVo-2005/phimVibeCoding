import Image from 'next/image';

export interface EpisodeItem {
  id: string;
  number: number;
  title: string;
  description: string;
  duration: string;
  locked: boolean;
  thumbnailSrc: string;
}

/**
 * EpisodeList — khớp "Danh sách tập" trong `design/moviedentail.html`. D5: 1 component, 2 nhánh
 * JSX theo breakpoint (không dùng state) — desktop là lưới thẻ 16:9 + mô tả, mobile là danh sách
 * hàng ngang + icon khoá cho tập chưa mở. `locked` chỉ là UI tĩnh mô phỏng đúng design — KHÔNG có
 * logic mở khoá/kiểm tra quyền thật.
 */
export function EpisodeList({ episodes }: { episodes: EpisodeItem[] }) {
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
