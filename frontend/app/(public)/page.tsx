import { CategoryTile } from '@/components/film/CategoryTile';
import { ContinueWatchingCard } from '@/components/film/ContinueWatchingCard';
import { HeroBanner } from '@/components/film/HeroBanner';
import { MovieCard } from '@/components/film/MovieCard';
import { TopRatedListItem } from '@/components/film/TopRatedListItem';
import { Badge } from '@/components/ui/Badge';
import { Section } from '@/components/ui/Section';
import {
  categoryTiles,
  continueWatching,
  heroFilm,
  recommendations,
  topRated,
  trending,
} from './_mock/homepage-data';

/**
 * Trang chủ — UI tĩnh khớp `design/homepage.html` (Phase 10.2). Dữ liệu từ `_mock/homepage-data.ts`
 * (mock tối thiểu, KHÔNG gọi API/React Query/Zustand, không business logic). SideNavBar (widget
 * tài khoản nổi) tiếp tục KHÔNG dựng — giữ nguyên quyết định đã thống nhất ở Phase 10.1.
 */
export default function HomePage() {
  return (
    <div className="space-y-xl pb-xl">
      <HeroBanner
        title={heroFilm.title}
        badge={heroFilm.badge}
        meta={heroFilm.meta}
        description={heroFilm.description}
        imageSrc={heroFilm.imageSrc}
      />

      <Section title="Tiếp tục xem">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-md">
          {continueWatching.map((item) => (
            <ContinueWatchingCard
              key={item.id}
              title={item.title}
              subtitle={item.subtitle}
              imageSrc={item.imageSrc}
              progressPercent={item.progressPercent}
            />
          ))}
        </div>
      </Section>

      <Section title="Đang thịnh hành">
        <div className="flex overflow-x-auto gap-md pb-2">
          {trending.map((item) => (
            <div key={item.id} className="min-w-[200px] lg:min-w-[240px] flex-shrink-0">
              <MovieCard
                title={item.title}
                imageSrc={item.imageSrc}
                badges={
                  <>
                    {item.badges.map((badge) => (
                      <Badge key={badge} variant="primary" className="border-none">
                        {badge}
                      </Badge>
                    ))}
                  </>
                }
              />
            </div>
          ))}
        </div>
      </Section>

      <section className="px-gutter grid grid-cols-1 lg:grid-cols-12 gap-lg">
        <div className="lg:col-span-8 space-y-md">
          <h2 className="text-headline-lg font-headline-lg">Khám phá Thể loại</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-base">
            {categoryTiles.map((tile) => (
              <CategoryTile
                key={tile.id}
                label={tile.label}
                imageSrc={tile.imageSrc}
                size={tile.size}
                overlayClassName={tile.overlayClassName}
              />
            ))}
          </div>
        </div>
        <div className="lg:col-span-4 space-y-md">
          <h2 className="text-headline-lg font-headline-lg">Đánh giá cao</h2>
          <div className="space-y-base">
            {topRated.map((item) => (
              <TopRatedListItem
                key={item.id}
                title={item.title}
                score={item.score}
                imageSrc={item.imageSrc}
              />
            ))}
          </div>
        </div>
      </section>

      <Section title="Gợi ý riêng cho bạn">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-md">
          {recommendations.map((item) => (
            <MovieCard
              key={item.id}
              title={item.title}
              imageSrc={item.imageSrc}
              showTitle={false}
            />
          ))}
        </div>
      </Section>
    </div>
  );
}
