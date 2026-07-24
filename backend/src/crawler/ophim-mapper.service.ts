import { Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { ActorsService } from '../actors/actors.service';
import { CategoriesService } from '../categories/categories.service';
import { FilmCategory, FilmStatus } from '../common/constants';
import { toSlug } from '../common/utils/slugify.util';
import { Film } from '../films/schemas/film.schema';
import { OphimMovieDetail, OphimMovieDetailResponse } from './interfaces/ophim-response.interface';

@Injectable()
export class OphimMapperService {
  constructor(
    private readonly actorsService: ActorsService,
    private readonly categoriesService: CategoriesService,
  ) {}

  private mapCategory(type?: string): FilmCategory {
    if (!type) return FilmCategory.SINGLE;
    return type.toLowerCase().includes('series') || type.toLowerCase() === 'hoathinh'
      ? FilmCategory.SERIES
      : FilmCategory.SINGLE;
  }

  private mapStatus(status?: string): FilmStatus {
    return status?.toLowerCase() === 'ongoing' ? FilmStatus.ONGOING : FilmStatus.COMPLETED;
  }

  /** Resolve/tạo Actor documents theo tên, trả về danh sách ObjectId để gán vào Film.actors */
  private async resolveActorIds(names: string[] = []): Promise<Types.ObjectId[]> {
    const ids: Types.ObjectId[] = [];
    for (const name of names) {
      const trimmed = name?.trim();
      if (!trimmed) continue;
      const actor = await this.actorsService.findOrCreateByName(trimmed);
      ids.push(actor._id as Types.ObjectId);
    }
    return ids;
  }

  /** Resolve/tạo Category documents theo tên (category từ ophim), trả về danh sách ObjectId */
  private async resolveCategoryIds(
    categories: { name: string; slug?: string }[] = [],
  ): Promise<Types.ObjectId[]> {
    const ids: Types.ObjectId[] = [];
    for (const category of categories) {
      const name = category?.name?.trim();
      if (!name) continue;
      const found = await this.categoriesService.findOrCreateByName(name);
      ids.push(found._id as Types.ObjectId);
    }
    return ids;
  }

  /** Map response chi tiết phim từ ophim.cc sang shape của Film schema nội bộ (dùng cho upsert). */
  async mapToFilmData(response: OphimMovieDetailResponse): Promise<Partial<Film>> {
    const movie: OphimMovieDetail = response.movie;

    const [actorIds, typeIds] = await Promise.all([
      this.resolveActorIds(movie.actor),
      this.resolveCategoryIds(movie.category ?? []),
    ]);

    const countryNames = (movie.country ?? []).map((c) => c.name).join(', ');

    const episodes = (response.episodes ?? []).map((server) => ({
      serverName: server.server_name,
      items: (server.server_data ?? []).map((ep) => ({
        name: ep.name,
        slug: ep.slug,
        embedUrl: ep.link_embed ?? '',
        m3u8Url: ep.link_m3u8 ?? '',
      })),
    }));

    return {
      slug: toSlug(movie.slug || movie.name),
      title: movie.name,
      originalTitle: movie.origin_name ?? '',
      description: movie.content ?? '',
      posterUrl: movie.poster_url ?? '',
      thumbUrl: movie.thumb_url ?? '',
      trailerUrl: movie.trailer_url ?? '',
      category: this.mapCategory(movie.type),
      episodeCurrent: movie.episode_current ?? '',
      episodeTotal: movie.episode_total ?? '',
      duration: movie.time ?? '',
      quality: movie.quality ?? '',
      language: movie.lang ?? '',
      releaseYear: movie.year ?? null,
      country: countryNames,
      director: (movie.director ?? []).filter(Boolean).join(', '),
      actors: actorIds,
      types: typeIds,
      episodes,
      status: this.mapStatus(movie.status),
      sourceSlug: movie.slug,
      sourceUpdatedAt: new Date(),
    };
  }
}
