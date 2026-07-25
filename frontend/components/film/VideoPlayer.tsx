import Image from 'next/image';

/**
 * VideoPlayer — khớp khối trình phát video trong `design/watchmovie.html` (desktop + mobile, 1
 * cây responsive). D1: CHỈ dựng UI tĩnh — không `<video>`, không hls.js, không playback, không
 * state. Toàn bộ nút bấm/thanh tiến trình chỉ là hình ảnh tĩnh mô phỏng đúng design, KHÔNG có
 * `onClick`/xử lý thật.
 */
export function VideoPlayer({
  backdropSrc,
  currentTimeLabel,
}: {
  backdropSrc: string;
  currentTimeLabel: string;
}) {
  return (
    <div className="group relative aspect-video md:aspect-auto md:h-[500px] lg:h-[716px] overflow-hidden bg-black shadow-2xl md:rounded-[20px]">
      <div className="absolute inset-0 z-0">
        <Image
          src={backdropSrc}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-90"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
      </div>

      {/* Mobile: nút quay lại + cài đặt/cast trên overlay video (khác Header, chỉ trang trí) */}
      <div className="md:hidden absolute inset-x-0 top-0 z-10 flex justify-between items-start p-4">
        <button
          type="button"
          className="p-2 bg-white/10 backdrop-blur-xl border border-white/10 rounded-full"
          aria-label="Quay lại"
        >
          <span className="material-symbols-outlined text-white" aria-hidden="true">
            arrow_back
          </span>
        </button>
        <div className="flex gap-3">
          <button
            type="button"
            className="p-2 bg-white/10 backdrop-blur-xl border border-white/10 rounded-full"
            aria-label="Cài đặt"
          >
            <span className="material-symbols-outlined text-white" aria-hidden="true">
              settings
            </span>
          </button>
          <button
            type="button"
            className="p-2 bg-white/10 backdrop-blur-xl border border-white/10 rounded-full"
            aria-label="Phát trên thiết bị khác"
          >
            <span className="material-symbols-outlined text-white" aria-hidden="true">
              cast
            </span>
          </button>
        </div>
      </div>

      {/* Nút phát trung tâm */}
      <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
        <div className="w-16 h-16 md:w-24 md:h-24 rounded-full bg-white/[0.03] backdrop-blur-xl border border-white/10 flex items-center justify-center transition-all duration-500 md:group-hover:scale-110">
          <span
            className="material-symbols-outlined text-primary text-4xl md:text-[48px]"
            style={{ fontVariationSettings: "'FILL' 1" }}
            aria-hidden="true"
          >
            play_arrow
          </span>
        </div>
      </div>

      {/* Thanh điều khiển dưới cùng — desktop chỉ hiện khi hover, mobile luôn hiện */}
      <div className="absolute bottom-0 left-0 w-full p-4 md:p-md z-20 md:translate-y-4 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100 transition-all duration-300">
        <div className="md:bg-white/[0.03] md:backdrop-blur-xl md:border md:border-white/10 rounded-xl md:p-base flex flex-col gap-2 md:gap-xs">
          <div className="relative w-full h-1 bg-white/10 rounded-full">
            <div className="absolute top-0 left-0 h-full w-1/3 bg-primary rounded-full" />
          </div>
          <div className="flex items-center justify-between">
            <div className="hidden md:flex items-center gap-md text-on-surface">
              <span className="material-symbols-outlined" aria-hidden="true">
                play_arrow
              </span>
              <span className="material-symbols-outlined" aria-hidden="true">
                skip_next
              </span>
              <span className="material-symbols-outlined" aria-hidden="true">
                volume_up
              </span>
              <span className="text-label-md font-label-md">{currentTimeLabel}</span>
            </div>
            <span className="md:hidden text-[12px] font-label-md text-white/80">
              {currentTimeLabel}
            </span>
            <div className="flex items-center gap-md text-white md:text-on-surface">
              <span className="hidden md:inline material-symbols-outlined" aria-hidden="true">
                settings
              </span>
              <span className="material-symbols-outlined" aria-hidden="true">
                closed_caption
              </span>
              <span className="material-symbols-outlined" aria-hidden="true">
                fullscreen
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
