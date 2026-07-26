import Image from 'next/image';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { RatingInput } from './RatingInput';

/**
 * FilmHero — khớp phần hero backdrop + poster nổi + panel thông tin trong
 * `design/moviedentail.html` (cả desktop lẫn mobile, 1 cây responsive duy nhất theo quyết định
 * Phase 10.1). Chỉ presentational, dữ liệu mock truyền qua props — không fetch/API.
 *
 * Synopsis (D2): KHÔNG có nút "Xem thêm/Thu gọn" — dùng đúng kỹ thuật CSS thuần
 * (`line-clamp-3 lg:line-clamp-none`) mà bản desktop của chính design đã dùng, không cần JS/state.
 *
 * Phase 14A: nút "+" nối `isFavorited`/`onToggleFavorite` (logic thật ở `FilmDetailView` qua
 * `useFavorite`, component này KHÔNG tự gọi API). KHÔNG đổi icon/text — chỉ toggle
 * `fontVariationSettings` FILL (0↔1) trên CÙNG icon `add`, giống kỹ thuật đã dùng cho icon `star`
 * ở trên — phản ánh trạng thái mà không đổi thiết kế.
 *
 * Phase 14B: thêm `RatingInput` ngay cạnh khối hiển thị điểm trung bình (đúng vị trí rating hiện
 * tại) — widget MỚI (không có trong Figma, tạo theo yêu cầu tường minh của phase này), logic thật
 * ở `FilmDetailView` qua `useRating`.
 */
export function FilmHero({
  title,
  quality,
  year,
  duration,
  rating,
  genres,
  description,
  posterSrc,
  backdropSrc,
  cast,
  isFavorited,
  onToggleFavorite,
  myRating,
  onSelectRating,
}: {
  title: string;
  quality: string;
  year: string;
  duration: string;
  rating: string;
  genres: string[];
  description: string;
  posterSrc: string;
  backdropSrc: string;
  cast: Array<{ id: string; name: string; avatarSrc: string }>;
  isFavorited?: boolean;
  onToggleFavorite?: () => void;
  myRating?: number | null;
  onSelectRating?: (score: number) => void;
}) {
  return (
    <section className="relative min-h-[600px] lg:h-[870px] w-full overflow-hidden">
      <div className="absolute inset-0 z-0">
        <Image src={backdropSrc} alt="" fill priority sizes="100vw" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
      </div>

      <div className="relative z-10 h-full flex flex-col justify-end px-gutter pb-xl">
        <div className="flex flex-col lg:flex-row gap-lg items-end lg:items-start">
          {/* Poster nổi — chỉ desktop, khớp design (`hidden lg:block`) */}
          <div className="hidden lg:block w-72 shrink-0">
            <div className="aspect-[2/3] rounded-[20px] overflow-hidden shadow-2xl shadow-black/50 border border-white/10 relative">
              <Image src={posterSrc} alt={title} fill sizes="288px" className="object-cover" />
            </div>
          </div>

          <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 p-lg rounded-[24px] flex-1 w-full max-w-4xl">
            <div className="flex flex-wrap items-center gap-base mb-sm">
              <Badge variant="primary" className="uppercase tracking-wider">
                {quality}
              </Badge>
              <Badge>{year}</Badge>
              <Badge>{duration}</Badge>
              <div className="flex items-center gap-xs ml-auto">
                <span className="material-symbols-outlined text-primary" aria-hidden="true">
                  star
                </span>
                <span className="font-headline-md text-on-surface">{rating}</span>
                <span className="text-on-surface-variant/50 text-label-md">IMDb</span>
              </div>
            </div>

            {onSelectRating ? (
              <div className="mb-md">
                <RatingInput myRating={myRating ?? null} onSelect={onSelectRating} />
              </div>
            ) : null}

            <h1 className="text-display-lg font-display-lg text-white mb-base leading-none">
              {title}
            </h1>

            <div className="flex flex-wrap gap-base mb-md">
              {genres.map((genre, index) => (
                <span key={genre} className="flex items-center gap-base">
                  {index > 0 ? <span className="text-on-surface/30">•</span> : null}
                  <span className="text-primary-container font-label-md">{genre}</span>
                </span>
              ))}
            </div>

            <p className="text-body-lg font-body-lg text-on-surface-variant mb-lg line-clamp-3 lg:line-clamp-none max-w-2xl">
              {description}
            </p>

            <div className="mb-lg">
              <h3 className="text-label-md font-label-md uppercase text-on-surface-variant/70 mb-sm tracking-widest">
                Diễn viên chính
              </h3>
              <div className="flex gap-md overflow-x-auto pb-base">
                {cast.map((actor) => (
                  <div key={actor.id} className="flex flex-col items-center gap-xs shrink-0">
                    <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-transparent relative">
                      <Image
                        src={actor.avatarSrc}
                        alt={actor.name}
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    </div>
                    <span className="text-label-md font-label-md text-on-surface-variant">
                      {actor.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-md">
              <Button variant="primary" className="px-lg py-4 rounded-xl">
                <span className="material-symbols-outlined" aria-hidden="true">
                  play_arrow
                </span>
                XEM NGAY
              </Button>
              <Button variant="secondary" className="px-lg py-4 rounded-xl">
                <span className="material-symbols-outlined" aria-hidden="true">
                  movie
                </span>
                TRAILER
              </Button>
              <Button
                variant="secondary"
                className="w-14 h-14 rounded-xl p-0"
                onClick={onToggleFavorite}
                aria-pressed={isFavorited}
              >
                <span
                  className="material-symbols-outlined"
                  aria-hidden="true"
                  style={{ fontVariationSettings: `'FILL' ${isFavorited ? 1 : 0}` }}
                >
                  add
                </span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
