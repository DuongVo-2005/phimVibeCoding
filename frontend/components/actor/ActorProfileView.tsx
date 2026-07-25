import { Container } from '@/components/layout/Container';
import { ActorDetailsPanel } from '@/components/actor/ActorDetailsPanel';
import { ActorHero } from '@/components/actor/ActorHero';
import { AwardCard } from '@/components/actor/AwardCard';
import { FilmographyCard } from '@/components/actor/FilmographyCard';
import { actorProfile, awards, filmography } from '@/app/(public)/_mock/actorprofile-data';

/**
 * ActorProfileView — nội dung trang hồ sơ diễn viên, khớp `design/actorprofile.html`. Route
 * `/dien-vien/[slug]` chỉ có 1 nội dung mock cố định (không suy diễn theo slug, cùng lý do đã áp
 * dụng ở `FilmDetailView`). KHÔNG gọi API, không state (đúng phạm vi đã xác nhận Phase 10.7).
 *
 * Quyết định C: không dùng `<details>`/accordion — "Tiểu Sử" là 1 section luôn mở, dùng chung mọi
 * kích thước (thay vì accordion mobile + panel desktop riêng biệt như design gốc).
 *
 * Quyết định D: không có nút "Đọc thêm" — hiện trọn vẹn `fullBio`, không `line-clamp` (2 bản
 * design đều hiện trọn văn bản khi đã mở/không có clamp thật trong HTML gốc, nên không cần giả
 * lập giới hạn dòng tuỳ tiện).
 *
 * KHÔNG dựng "Mạng xã hội" (social icon) và khối quảng cáo bento ở sidebar desktop — 2 phần này
 * không thuộc phạm vi đã xác nhận (chỉ hero/tiểu sử/tác phẩm/giải thưởng/thông tin chi tiết).
 */
export function ActorProfileView() {
  return (
    <div className="flex flex-col">
      <ActorHero
        name={actorProfile.name}
        roleLabel={actorProfile.roleLabel}
        rating={actorProfile.rating}
        ratingLabel={actorProfile.ratingLabel}
        ageLocation={actorProfile.ageLocation}
        shortBio={actorProfile.shortBio}
        heroImageSrc={actorProfile.heroImageSrc}
      />

      <Container
        maxWidth="max-w-screen-2xl"
        className="py-xl grid grid-cols-1 md:grid-cols-12 gap-xl"
      >
        <div className="md:col-span-8 flex flex-col gap-xl">
          <section>
            <h2 className="text-headline-lg font-headline-lg mb-md text-primary">Tiểu Sử</h2>
            <div className="bg-surface-container-low p-lg rounded-xl border border-white/5">
              <p className="text-body-lg font-body-lg text-on-surface-variant leading-relaxed">
                {actorProfile.fullBio}
              </p>
            </div>
          </section>

          <section>
            <div className="flex justify-between items-end mb-md">
              <h2 className="text-headline-lg font-headline-lg text-on-surface">
                Tác phẩm nổi bật
              </h2>
              <button
                type="button"
                className="text-primary text-label-md font-label-md hover:underline"
              >
                Tất cả phim
              </button>
            </div>
            <div className="flex gap-md overflow-x-auto pb-md">
              {filmography.map((item) => (
                <FilmographyCard
                  key={item.id}
                  title={item.title}
                  year={item.year}
                  genre={item.genre}
                  imageSrc={item.imageSrc}
                  rating={item.rating}
                />
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-headline-lg font-headline-lg mb-md text-on-surface">
              Giải thưởng &amp; Đề cử
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
              {awards.map((award) => (
                <AwardCard
                  key={award.id}
                  icon={award.icon}
                  title={award.title}
                  description={award.description}
                />
              ))}
            </div>
          </section>
        </div>

        <aside className="md:col-span-4">
          <div className="md:sticky md:top-28">
            <ActorDetailsPanel
              birthDate={actorProfile.birthDate}
              birthPlace={actorProfile.birthPlace}
              occupation={actorProfile.occupation}
              height={actorProfile.height}
            />
          </div>
        </aside>
      </Container>
    </div>
  );
}
