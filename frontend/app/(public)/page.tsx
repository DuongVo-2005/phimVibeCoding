import { CategoriesSection } from '@/components/film/CategoriesSection';
import { ContinueWatchingSection } from '@/components/film/ContinueWatchingSection';
import { HeroSection } from '@/components/film/HeroSection';
import { MovieCard } from '@/components/film/MovieCard';
import { TopRatedSection } from '@/components/film/TopRatedSection';
import { TrendingSection } from '@/components/film/TrendingSection';
import { Section } from '@/components/ui/Section';
import { recommendations } from './_mock/homepage-data';

/**
 * Trang chủ — UI khớp `design/homepage.html` (Phase 10.2). Phase 11.4/11.4A: Hero/Tiếp tục xem/
 * Đang thịnh hành/Khám phá Thể loại/Đánh giá cao đã nối API thật qua các Section component riêng
 * (React Query) — xem `components/film/{HeroSection,ContinueWatchingSection,TrendingSection,
 * CategoriesSection,TopRatedSection}.tsx`. Chỉ "Gợi ý riêng cho bạn" còn dùng
 * `_mock/homepage-data.ts` — backend chưa có endpoint recommend (xem audit Phase 11.4, mục 9).
 * SideNavBar (widget tài khoản nổi) tiếp tục KHÔNG dựng — giữ nguyên quyết định Phase 10.1.
 */
export default function HomePage() {
  return (
    <div className="space-y-xl pb-xl">
      <HeroSection />

      <ContinueWatchingSection />

      <TrendingSection />

      <section className="px-gutter grid grid-cols-1 lg:grid-cols-12 gap-lg">
        <CategoriesSection />
        <TopRatedSection />
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
