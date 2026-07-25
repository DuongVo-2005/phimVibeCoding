import { WatchMovieView } from '@/components/film/WatchMovieView';

export default async function WatchFilmPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  return <WatchMovieView slug={slug} />;
}
