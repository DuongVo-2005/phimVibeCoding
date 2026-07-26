import type { Metadata } from 'next';
import { FilmDetailView } from '@/components/film/FilmDetailView';
import { filmsApi } from '@/lib/api/films';

// Phase 18: audit phát hiện MỌI route public dùng chung `<title>RoPhim</title>` từ root layout —
// riêng trang chi tiết phim còn nặng hơn: MỌI phim khác nhau đều ra title/description giống hệt
// nhau (trùng lặp toàn site). `filmsApi.bySlug` gọi được thẳng ở Server Component (chỉ là
// `fetch()` qua `lib/api/client.ts`, không cần hook/client-only API) — dùng ĐÚNG field thật
// (`title`/`description`/`posterUrl`/`thumbUrl`), không bịa thêm. Phim không tồn tại/lỗi mạng →
// fallback title chung, KHÔNG throw (metadata không được phép làm sập trang).
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const film = await filmsApi.bySlug(slug);
    const description = film.description || 'RoPhim — xem phim trực tuyến';
    const imageSrc = film.posterUrl ?? film.thumbUrl;
    return {
      title: film.title,
      description,
      openGraph: {
        title: film.title,
        description,
        images: imageSrc ? [imageSrc] : undefined,
      },
    };
  } catch {
    return { title: 'Chi tiết phim' };
  }
}

export default async function FilmDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  return <FilmDetailView slug={slug} />;
}
