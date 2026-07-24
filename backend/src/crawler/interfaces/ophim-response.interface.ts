// Typed shapes for the public ophim.cc-compatible movie API responses.
// Field names follow the API's own JSON contract so the mapper can translate 1:1.

export interface OphimCategoryRef {
  id?: string;
  name: string;
  slug: string;
}

export interface OphimListItem {
  name: string;
  origin_name?: string;
  slug: string;
  thumb_url?: string;
  poster_url?: string;
  year?: number;
  modified?: { time?: string };
}

export interface OphimListResponse {
  status?: string | boolean;
  items?: OphimListItem[];
  data?: {
    items?: OphimListItem[];
    params?: {
      pagination?: {
        totalItems?: number;
        totalItemsPerPage?: number;
        currentPage?: number;
        totalPages?: number;
      };
    };
  };
  pagination?: {
    totalItems?: number;
    totalItemsPerPage?: number;
    currentPage?: number;
    totalPages?: number;
  };
}

export interface OphimEpisodeServerData {
  name: string;
  slug: string;
  filename?: string;
  link_embed?: string;
  link_m3u8?: string;
}

export interface OphimEpisodeServer {
  server_name: string;
  server_data: OphimEpisodeServerData[];
}

export interface OphimMovieDetail {
  name: string;
  origin_name?: string;
  slug: string;
  content?: string;
  type?: string; // 'single' | 'series' | ...
  status?: string; // 'ongoing' | 'completed'
  thumb_url?: string;
  poster_url?: string;
  trailer_url?: string;
  time?: string;
  episode_current?: string;
  episode_total?: string;
  quality?: string;
  lang?: string;
  year?: number;
  view?: number;
  actor?: string[];
  director?: string[];
  category?: OphimCategoryRef[];
  country?: OphimCategoryRef[];
}

export interface OphimMovieDetailResponse {
  status?: string | boolean;
  movie: OphimMovieDetail;
  episodes?: OphimEpisodeServer[];
}
