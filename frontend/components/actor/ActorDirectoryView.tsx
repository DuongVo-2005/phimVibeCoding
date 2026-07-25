import { Container } from '@/components/layout/Container';
import { ActorCard } from '@/components/actor/ActorCard';
import { AlphabetFilter } from '@/components/actor/AlphabetFilter';
import { actors, regionTags } from '@/app/(public)/_mock/actordirectory-data';

/**
 * ActorDirectoryView — nội dung trang danh sách diễn viên, khớp `design/actorderectory.html`.
 * KHÔNG gọi API, không state (đúng phạm vi đã xác nhận Phase 10.6).
 *
 * Quyết định A: KHÔNG dựng sidebar tài khoản desktop (artifact export dính từ userdasboard.html,
 * không thuộc nội dung trang này) — layout chỉ 1 cột full-width, không có `<aside>`.
 *
 * Tiêu đề/mô tả: design lệch giữa desktop ("Diễn Viên" / mô tả tiếng Việt) và mobile ("Trending
 * Stars" / "2,482 actors found" — tiếng Anh, không khớp UI 100% tiếng Việt của dự án) — chỉ giữ 1
 * bộ giá trị (theo bản desktop) cho mọi kích thước, cùng nguyên tắc đã áp dụng từ Phase 10.2.
 */
export function ActorDirectoryView() {
  return (
    <Container maxWidth="max-w-screen-2xl" className="py-lg flex flex-col gap-lg">
      <section className="flex flex-col gap-md">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-md">
          <div>
            <h1 className="text-headline-lg md:text-headline-xl font-headline-xl text-on-surface tracking-tight">
              Diễn Viên
            </h1>
            <p className="text-on-surface-variant text-body-md mt-xs">
              Khám phá những gương mặt điện ảnh nổi bật nhất.
            </p>
          </div>
          <div className="relative w-full md:w-96">
            <span
              className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant"
              aria-hidden="true"
            >
              search
            </span>
            <input
              type="text"
              readOnly
              placeholder="Tìm kiếm tên diễn viên..."
              className="w-full bg-surface-container-high border-none rounded-full py-3 pl-12 pr-6 text-body-md"
            />
          </div>
        </div>

        <AlphabetFilter />

        <div className="flex flex-wrap items-center gap-xs">
          {regionTags.map((tag) => (
            <button
              key={tag}
              type="button"
              className="px-md py-1 rounded-full bg-white/5 border border-white/10 text-label-md font-label-md text-on-surface"
            >
              {tag}
            </button>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-md">
        {actors.map((actor) => (
          <ActorCard
            key={actor.id}
            name={actor.name}
            country={actor.country}
            filmCountLabel={actor.filmCountLabel}
            imageSrc={actor.imageSrc}
          />
        ))}
      </div>
    </Container>
  );
}
