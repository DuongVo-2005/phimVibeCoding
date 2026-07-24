import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { ActorsService } from '../actors/actors.service';
import { CategoriesService } from '../categories/categories.service';
import { CountriesService } from '../countries/countries.service';
import { DirectorsService } from '../directors/directors.service';
import { OphimMovieDetailResponse } from './interfaces/ophim-response.interface';
import { OphimMapperService } from './ophim-mapper.service';

describe('OphimMapperService', () => {
  let service: OphimMapperService;
  let countriesService: { findOrCreateByName: jest.Mock };
  let directorsService: { findOrCreateByName: jest.Mock };

  beforeEach(async () => {
    countriesService = { findOrCreateByName: jest.fn() };
    directorsService = { findOrCreateByName: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OphimMapperService,
        { provide: ActorsService, useValue: { findOrCreateByName: jest.fn() } },
        { provide: CategoriesService, useValue: { findOrCreateByName: jest.fn() } },
        { provide: CountriesService, useValue: countriesService },
        { provide: DirectorsService, useValue: directorsService },
      ],
    }).compile();

    service = module.get(OphimMapperService);
  });

  describe('mapToFilmData', () => {
    const baseResponse = (): OphimMovieDetailResponse => ({
      movie: {
        name: 'Phim Test',
        slug: 'phim-test',
        director: ['Vương Gia Vệ', 'Trương Nghệ Mưu'],
        country: [
          { name: 'Việt Nam', slug: 'viet-nam' },
          { name: 'Hàn Quốc', slug: 'han-quoc' },
        ],
      },
      episodes: [],
    });

    it('resolve/tạo Country và Director theo tên, gán ObjectId vào countries/directors', async () => {
      const vietNamId = new Types.ObjectId();
      const hanQuocId = new Types.ObjectId();
      const dao1Id = new Types.ObjectId();
      const dao2Id = new Types.ObjectId();

      countriesService.findOrCreateByName
        .mockResolvedValueOnce({ _id: vietNamId })
        .mockResolvedValueOnce({ _id: hanQuocId });
      directorsService.findOrCreateByName
        .mockResolvedValueOnce({ _id: dao1Id })
        .mockResolvedValueOnce({ _id: dao2Id });

      const result = await service.mapToFilmData(baseResponse());

      expect(countriesService.findOrCreateByName).toHaveBeenCalledWith('Việt Nam');
      expect(countriesService.findOrCreateByName).toHaveBeenCalledWith('Hàn Quốc');
      expect(directorsService.findOrCreateByName).toHaveBeenCalledWith('Vương Gia Vệ');
      expect(directorsService.findOrCreateByName).toHaveBeenCalledWith('Trương Nghệ Mưu');

      expect(result.countries).toEqual([vietNamId, hanQuocId]);
      expect(result.directors).toEqual([dao1Id, dao2Id]);
      expect(result).not.toHaveProperty('country');
      expect(result).not.toHaveProperty('director');
    });

    it('không gọi service khi không có country/director từ ophim', async () => {
      const response = baseResponse();
      response.movie.country = [];
      response.movie.director = [];

      const result = await service.mapToFilmData(response);

      expect(countriesService.findOrCreateByName).not.toHaveBeenCalled();
      expect(directorsService.findOrCreateByName).not.toHaveBeenCalled();
      expect(result.countries).toEqual([]);
      expect(result.directors).toEqual([]);
    });
  });
});
