import { FilmDetailView } from '@/components/film/FilmDetailView';

export default async function FilmDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  return <FilmDetailView slug={slug} />;
}
