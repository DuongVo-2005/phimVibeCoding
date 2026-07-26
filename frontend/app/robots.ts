import type { MetadataRoute } from 'next';
import { env } from '@/lib/env';

/**
 * Phase 18: audit phát hiện `robots.ts`/`robots.txt` không tồn tại — search engine không có chỉ
 * dẫn crawl nào. Dùng Next.js file convention có sẵn (không cần package). Chặn `/user/` (khu vực
 * cá nhân, yêu cầu đăng nhập — không có giá trị index) và `/admin/` (khu vực quản trị).
 */
export default function robots(): MetadataRoute.Robots {
  const siteUrl = env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/user/', '/admin/'],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
