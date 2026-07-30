import { render, screen, waitFor } from '@testing-library/react';
import { VerifyEmailStatus } from '../components/auth/VerifyEmailStatus';
import { authApi } from '../lib/api/auth';
import { ApiRequestError } from '../lib/api/client';

const mockGet = jest.fn();

jest.mock('next/navigation', () => ({
  useSearchParams: () => ({ get: mockGet }),
}));

jest.mock('../lib/api/auth', () => ({
  authApi: { verifyEmail: jest.fn() },
}));

const mockedVerifyEmail = authApi.verifyEmail as jest.Mock;

describe('VerifyEmailStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('không có token trong URL -> hiện thẳng trạng thái "không hợp lệ", KHÔNG gọi API', async () => {
    mockGet.mockReturnValue(null);

    render(<VerifyEmailStatus />);

    expect(screen.getByText('Đường dẫn không hợp lệ')).toBeInTheDocument();
    expect(mockedVerifyEmail).not.toHaveBeenCalled();
  });

  it('token hợp lệ, API thành công (200) -> hiện trạng thái Success', async () => {
    mockGet.mockReturnValue('valid-token');
    mockedVerifyEmail.mockResolvedValue({ message: 'Xác thực email thành công' });

    render(<VerifyEmailStatus />);

    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: 'Xác thực email thành công' }),
      ).toBeInTheDocument(),
    );
    expect(mockedVerifyEmail).toHaveBeenCalledWith('valid-token');
  });

  it('API trả 410 -> hiện trạng thái "đường dẫn đã hết hạn"', async () => {
    mockGet.mockReturnValue('expired-token');
    mockedVerifyEmail.mockRejectedValue(new ApiRequestError(410, 'Token xác thực đã hết hạn'));

    render(<VerifyEmailStatus />);

    await waitFor(() => expect(screen.getByText('Đường dẫn đã hết hạn')).toBeInTheDocument());
  });

  it('API trả 409 -> hiện trạng thái "đã được xác thực"', async () => {
    mockGet.mockReturnValue('already-verified-token');
    mockedVerifyEmail.mockRejectedValue(
      new ApiRequestError(409, 'Email đã được xác thực trước đó'),
    );

    render(<VerifyEmailStatus />);

    await waitFor(() => expect(screen.getByText('Email đã được xác thực')).toBeInTheDocument());
  });

  it('API trả 400 -> hiện trạng thái "không hợp lệ"', async () => {
    mockGet.mockReturnValue('bad-token');
    mockedVerifyEmail.mockRejectedValue(new ApiRequestError(400, 'Token xác thực không hợp lệ'));

    render(<VerifyEmailStatus />);

    await waitFor(() => expect(screen.getByText('Đường dẫn không hợp lệ')).toBeInTheDocument());
  });

  it('lỗi mạng (không phải ApiRequestError) -> hiện trạng thái lỗi chung', async () => {
    mockGet.mockReturnValue('any-token');
    mockedVerifyEmail.mockRejectedValue(new Error('Network request failed'));

    render(<VerifyEmailStatus />);

    await waitFor(() => expect(screen.getByText('Có lỗi xảy ra')).toBeInTheDocument());
  });
});
