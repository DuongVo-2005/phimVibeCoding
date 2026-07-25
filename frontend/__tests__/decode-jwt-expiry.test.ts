import { decodeJwtExpiry } from '@/lib/auth/decode-jwt-expiry';

function makeFakeJwt(payload: object): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64');
  return `${header}.${body}.fake-signature`;
}

describe('decodeJwtExpiry', () => {
  it('đọc đúng claim exp (giây) và quy đổi ra mili-giây', () => {
    const expSeconds = 1_800_000_000;
    const token = makeFakeJwt({ sub: 'user-1', exp: expSeconds });

    expect(decodeJwtExpiry(token)).toBe(expSeconds * 1000);
  });

  it('trả về null nếu token không đủ 3 phần', () => {
    expect(decodeJwtExpiry('not-a-jwt')).toBeNull();
  });

  it('trả về null nếu payload không có claim exp dạng number', () => {
    const token = makeFakeJwt({ sub: 'user-1' });
    expect(decodeJwtExpiry(token)).toBeNull();
  });
});
