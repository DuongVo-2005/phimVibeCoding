import { ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { ParseObjectIdPipe } from './parse-object-id.pipe';

const paramMeta = (data: string | undefined): ArgumentMetadata => ({
  type: 'param',
  data,
  metatype: String,
});

describe('ParseObjectIdPipe', () => {
  let pipe: ParseObjectIdPipe;

  beforeEach(() => {
    pipe = new ParseObjectIdPipe();
  });

  it('cho qua ObjectId 24-hex hợp lệ', () => {
    const value = '65f1a2b3c4d5e6f7a8b9c0d1';
    expect(pipe.transform(value, paramMeta('id'))).toBe(value);
  });

  it('ném BadRequestException (400) khi id không đủ 24 ký tự hex', () => {
    expect(() => pipe.transform('khong-hop-le', paramMeta('id'))).toThrow(BadRequestException);
  });

  it('ném BadRequestException khi id là chuỗi 12 ký tự (né lỗ hổng Types.ObjectId.isValid())', () => {
    expect(() => pipe.transform('123456789012', paramMeta('id'))).toThrow(BadRequestException);
  });

  it('ném BadRequestException khi id thừa/thiếu ký tự so với 24-hex', () => {
    expect(() => pipe.transform('65f1a2b3c4d5e6f7a8b9c0d1ff', paramMeta('id'))).toThrow(
      BadRequestException,
    );
  });

  it('bỏ qua param tên "slug" (không phải ObjectId theo quy ước dự án)', () => {
    expect(pipe.transform('hanh-dong', paramMeta('slug'))).toBe('hanh-dong');
  });

  it('bỏ qua param tên "targetType" (enum của Favorites)', () => {
    expect(pipe.transform('film', paramMeta('targetType'))).toBe('film');
  });

  it('bỏ qua giá trị không phải @Param() — vd @Body()/@Query()', () => {
    const value = { anything: 'khong-phai-object-id' };
    expect(pipe.transform(value, { type: 'body', data: undefined, metatype: Object })).toBe(
      value,
    );
    expect(
      pipe.transform('khong-hop-le', { type: 'query', data: 'search', metatype: String }),
    ).toBe('khong-hop-le');
  });

  it('bỏ qua khi @Param() không có tên cụ thể (lấy cả object params)', () => {
    const value = { id: 'khong-hop-le' };
    expect(pipe.transform(value, paramMeta(undefined))).toBe(value);
  });
});
