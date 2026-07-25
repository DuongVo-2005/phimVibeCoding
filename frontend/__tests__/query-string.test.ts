import { buildQueryString } from '@/lib/api/query-string';

describe('buildQueryString', () => {
  it('trả về chuỗi rỗng nếu không có params', () => {
    expect(buildQueryString()).toBe('');
    expect(buildQueryString({})).toBe('');
  });

  it('bỏ qua key có giá trị undefined/null', () => {
    expect(buildQueryString({ a: undefined, b: null, c: 'x' })).toBe('?c=x');
  });

  it('chuyển number/boolean thành string đúng', () => {
    const qs = buildQueryString({ page: 2, limit: 20, isPublished: false });
    const params = new URLSearchParams(qs.slice(1));
    expect(params.get('page')).toBe('2');
    expect(params.get('limit')).toBe('20');
    expect(params.get('isPublished')).toBe('false');
  });
});
