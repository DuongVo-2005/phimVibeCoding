import type { MetadataRoute } from 'next';
import { filmsApi } from '@/lib/api/films';
import { env } from '@/lib/env';

const STATIC_ROUTES = ['', '/phim-le', '/phim-bo'];

/**
 * Phase 18: audit phát hiện `sitemap.ts`/`sitemap.xml` không tồn tại — search engine không có cách
 * nào khác ngoài tự dò link để tìm ra `/phim/[slug]` (81 phim hiện có, xác nhận qua
 * `GET /films?limit=1` — meta.totalItems). Dùng Next.js file convention có sẵn (không cần package,
 * không thêm endpoint — chỉ gọi `filmsApi.list` đã có sẵn, tự lặp qua hết `meta.totalPages`, KHÔNG
 * hardcode `limit` lớn hơn `MAX_PAGE_LIMIT` thật của backend là 100).
 *
 * KHÔNG truyền `isPublished` — đã xác nhận thực nghiệm: `GET /films` public (không kèm access
 * token) mặc định CHỈ trả phim `isPublished:true` sẵn; tự truyền `isPublished=true` bị backend từ
 * chối 400 ("Tham số isPublished chỉ dành cho Admin", filter này chỉ Admin mới được dùng).
 * Lỗi mạng/backend down lúc build → bắt lỗi, trả về CHỈ route tĩnh thay vì làm sập cả `next build`.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified: new Date(),
  }));

  try {
    const films: { slug: string; updatedAt: string }[] = [];
    let page = 1;
    let totalPages = 1;

    do {
      const response = await filmsApi.list({ page, limit: 100 });
      films.push(...response.items.map((film) => ({ slug: film.slug, updatedAt: film.updatedAt })));
      totalPages = response.meta.totalPages;
      page += 1;
    } while (page <= totalPages);

    const filmEntries: MetadataRoute.Sitemap = films.map((film) => ({
      url: `${siteUrl}/phim/${film.slug}`,
      lastModified: new Date(film.updatedAt),
    }));

    return [...staticEntries, ...filmEntries];
  } catch {
    return staticEntries;
  }
}
