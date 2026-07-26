import { CategoriesSection } from '@/components/film/CategoriesSection';
import { ContinueWatchingSection } from '@/components/film/ContinueWatchingSection';
import { HeroSection } from '@/components/film/HeroSection';
import { LatestMoviesSection } from '@/components/film/LatestMoviesSection';
import { LatestSeriesSection } from '@/components/film/LatestSeriesSection';
import { MostCommentedSection } from '@/components/film/MostCommentedSection';
import { MovieCard } from '@/components/film/MovieCard';
import { TopRatedSection } from '@/components/film/TopRatedSection';
import { TrendingSection } from '@/components/film/TrendingSection';
import { Section } from '@/components/ui/Section';
import { recommendations } from './_mock/homepage-data';

/**
 * Trang chủ — UI khớp `design/homepage.html` (Phase 10.2). Phase 11.4/11.4A: Hero/Tiếp tục xem/
 * Đang thịnh hành/Khám phá Thể loại/Đánh giá cao đã nối API thật qua các Section component riêng
 * (React Query) — xem `components/film/{HeroSection,ContinueWatchingSection,TrendingSection,
 * CategoriesSection,TopRatedSection}.tsx`. Phase 11.5: thêm 3 section mới (không có trong
 * `design/homepage.html` gốc, xem audit Phase 11.5) — `LatestSeriesSection`,
 * `MostCommentedSection`, `LatestMoviesSection`, cùng pattern `TrendingSection`. Chỉ "Gợi ý riêng
 * cho bạn" còn dùng `_mock/homepage-data.ts` — backend chưa có endpoint recommend (BLOCKED, xem
 * audit Phase 11.5). SideNavBar (widget tài khoản nổi) tiếp tục KHÔNG dựng — giữ nguyên quyết định
 * Phase 10.1.
 */
export default function HomePage() {
  return (
    <div className="space-y-xl pb-xl">
      <HeroSection />

      <ContinueWatchingSection />

      <TrendingSection />

      <LatestSeriesSection />

      <MostCommentedSection />

      <LatestMoviesSection />

      {/* Phase 16C: `lg:items-start` — mặc định CSS Grid `align-items: stretch` kéo giãn
          `CategoriesSection` theo chiều cao `TopRatedSection` (danh sách, chiều cao phụ thuộc số
          lượng phim trả về), để lại khoảng trống dưới bento grid cố định của `CategoriesSection`.
          `items-start` giữ mỗi khối đúng chiều cao nội dung thật của nó, không khối nào bị kéo
          giãn theo khối kia. */}
      <section className="px-gutter grid grid-cols-1 lg:grid-cols-12 gap-lg lg:items-start">
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
              sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 16vw"
            />
          ))}
        </div>
      </Section>
    </div>
  );
}
