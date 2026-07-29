import { z } from 'zod';

/** Khớp `CreateCountryDto`/`UpdateCountryDto` thật (backend/src/countries/dto/*.dto.ts). */
export const countryFormSchema = z.object({
  name: z.string().trim().min(1, 'Vui lòng nhập tên quốc gia'),
  code: z.string().trim().max(10, 'Tối đa 10 ký tự').optional(),
});

export type CountryFormValues = z.infer<typeof countryFormSchema>;

export const COUNTRY_FORM_DEFAULTS: CountryFormValues = {
  name: '',
  code: '',
};
