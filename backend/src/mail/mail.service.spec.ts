import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import * as nodemailer from 'nodemailer';
import { MailService } from './mail.service';

jest.mock('nodemailer');

describe('MailService', () => {
  const buildModule = async (mailConfig: Record<string, unknown>) => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'mail') return mailConfig;
              if (key === 'app') return { nodeEnv: 'development' };
              return undefined;
            }),
          },
        },
      ],
    }).compile();

    return module.get(MailService);
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('MAIL_HOST trống (SMTP chưa cấu hình)', () => {
    it('isConfigured = false', async () => {
      const service = await buildModule({ host: undefined, port: 587, secure: false, from: 'x' });
      expect(service.isConfigured).toBe(false);
    });

    it('send() KHÔNG throw, KHÔNG gọi nodemailer.createTransport — chỉ log cảnh báo (không chặn luồng gọi)', async () => {
      const service = await buildModule({ host: undefined, port: 587, secure: false, from: 'x' });

      await expect(
        service.send({ to: 'a@example.com', subject: 's', html: '<p>x</p>', text: 'x' }),
      ).resolves.toBeUndefined();
      expect(nodemailer.createTransport).not.toHaveBeenCalled();
    });
  });

  describe('MAIL_HOST có giá trị (SMTP đã cấu hình)', () => {
    const sendMailMock = jest.fn().mockResolvedValue({ messageId: 'test' });

    beforeEach(() => {
      (nodemailer.createTransport as jest.Mock).mockReturnValue({ sendMail: sendMailMock });
    });

    it('isConfigured = true', async () => {
      const service = await buildModule({
        host: 'smtp.example.com',
        port: 587,
        secure: false,
        from: '"RoPhim" <no-reply@rophim.local>',
      });
      expect(service.isConfigured).toBe(true);
    });

    it('send() gọi transporter.sendMail với đúng from/to/subject/html/text', async () => {
      const service = await buildModule({
        host: 'smtp.example.com',
        port: 587,
        secure: false,
        from: '"RoPhim" <no-reply@rophim.local>',
      });

      await service.send({
        to: 'user@example.com',
        subject: 'Xác thực email',
        html: '<p>link</p>',
        text: 'link',
      });

      expect(sendMailMock).toHaveBeenCalledWith({
        from: '"RoPhim" <no-reply@rophim.local>',
        to: 'user@example.com',
        subject: 'Xác thực email',
        html: '<p>link</p>',
        text: 'link',
      });
    });

    it('có user/pass -> tạo transport kèm auth', async () => {
      await buildModule({
        host: 'smtp.example.com',
        port: 587,
        secure: false,
        user: 'smtp-user',
        pass: 'smtp-pass',
        from: 'x',
      });

      expect(nodemailer.createTransport).toHaveBeenCalledWith(
        expect.objectContaining({ auth: { user: 'smtp-user', pass: 'smtp-pass' } }),
      );
    });

    it('không có user/pass -> tạo transport KHÔNG có auth (SMTP relay nội bộ không cần xác thực)', async () => {
      await buildModule({ host: 'smtp.example.com', port: 587, secure: false, from: 'x' });

      expect(nodemailer.createTransport).toHaveBeenCalledWith(
        expect.objectContaining({ auth: undefined }),
      );
    });
  });

  describe('logDevToken', () => {
    it('môi trường development -> log qua Logger, không throw', async () => {
      const service = await buildModule({ host: undefined, port: 587, secure: false, from: 'x' });
      expect(() => service.logDevToken('Test token', 'a@example.com', 'abc123')).not.toThrow();
    });
  });
});
