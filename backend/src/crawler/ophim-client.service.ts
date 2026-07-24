import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosError } from 'axios';
import { firstValueFrom } from 'rxjs';
import { OphimConfig } from '../config/configuration';
import { OphimListResponse, OphimMovieDetailResponse } from './interfaces/ophim-response.interface';

@Injectable()
export class OphimClientService {
  private readonly logger = new Logger(OphimClientService.name);
  private readonly baseUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.baseUrl = this.configService.get<OphimConfig>('ophim')!.baseUrl;
  }

  async getUpdatedList(page: number): Promise<OphimListResponse | null> {
    const url = `${this.baseUrl}/danh-sach/phim-moi-cap-nhat`;
    const fullUrl = `${url}?page=${page}`;

    try {
      const response = await firstValueFrom(
        this.httpService.get<OphimListResponse>(url, { params: { page } }),
      );
      this.logger.log(`[getUpdatedList] GET ${fullUrl} — status=${response.status}`);
      return response.data;
    } catch (error) {
      this.logRequestError('getUpdatedList', fullUrl, error);
      return null;
    }
  }

  async getMovieDetail(slug: string): Promise<OphimMovieDetailResponse | null> {
    const url = `${this.baseUrl}/phim/${slug}`;

    try {
      const response = await firstValueFrom(this.httpService.get<OphimMovieDetailResponse>(url));
      this.logger.log(`[getMovieDetail] GET ${url} — status=${response.status}`);
      return response.data;
    } catch (error) {
      this.logRequestError('getMovieDetail', url, error);
      return null;
    }
  }

  /** Log đầy đủ URL đã gọi, HTTP status, và response body khi status != 200 (hoặc lỗi mạng/timeout). */
  private logRequestError(context: string, url: string, error: unknown) {
    const axiosError = error as AxiosError;
    const status = axiosError.response?.status;
    const body = axiosError.response?.data;

    if (status !== undefined) {
      this.logger.error(
        `[${context}] GET ${url} — status=${status}, body=${this.safeStringify(body)}`,
      );
    } else {
      // Không có response (timeout, DNS/network error...) — không có status/body để log.
      this.logger.error(`[${context}] GET ${url} — network error: ${axiosError?.message ?? error}`);
    }
  }

  private safeStringify(body: unknown): string {
    try {
      return JSON.stringify(body);
    } catch {
      return String(body);
    }
  }
}
