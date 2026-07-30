import { render, screen } from '@testing-library/react';
import { SessionProvider } from 'next-auth/react';
import { EmailVerificationStatus } from '../components/account/EmailVerificationStatus';
import { NotificationProvider } from '../components/providers/notification-provider';
import type { UserProfile } from '../lib/types/user';

const buildUser = (overrides: Partial<UserProfile> = {}): UserProfile => ({
  _id: 'user-1',
  email: 'user@example.com',
  name: 'Nguyen Van A',
  gender: 'other',
  role: 'user',
  roleIds: [],
  isActive: true,
  isEmailVerified: false,
  emailVerifiedAt: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

describe('EmailVerificationStatus', () => {
  it('isEmailVerified=true -> hiện badge "đã được xác thực", KHÔNG hiện nút Xác thực/Gửi lại', () => {
    render(
      <SessionProvider session={null}>
        <NotificationProvider>
          <EmailVerificationStatus user={buildUser({ isEmailVerified: true })} />
        </NotificationProvider>
      </SessionProvider>,
    );

    expect(screen.getByText('Email đã được xác thực')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('isEmailVerified=false -> hiện banner cảnh báo + nút "Xác thực Email"', () => {
    render(
      <SessionProvider session={null}>
        <NotificationProvider>
          <EmailVerificationStatus user={buildUser({ isEmailVerified: false })} />
        </NotificationProvider>
      </SessionProvider>,
    );

    expect(screen.getByText('Email chưa được xác thực')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Xác thực Email' })).toBeInTheDocument();
  });
});
