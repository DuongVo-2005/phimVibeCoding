import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { AppConfig, MailConfig } from '../config/configuration';

export interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
  text: string;
}

/**
 * MailService — Phase 33 (Verify Email). Trước phase này dự án KHÔNG có hạ tầng gửi email nào
 * (`forgotPassword` chỉ log token dev-only, xem `auth.service.ts`) — đây là service gửi mail đầu
 * tiên, cố ý viết đủ tổng quát (`send()` nhận `{to,subject,html,text}`) để tái dùng được cho
 * `forgotPassword` sau này, dù phase này chỉ NỐI nó vào luồng xác thực email (không sửa
 * `forgotPassword` — ngoài phạm vi yêu cầu).
 *
 * "Reuse existing mail infrastructure if present. If SMTP is already configured: send real email.
 * Otherwise: keep the existing development pattern (log token) without breaking production
 * support" — `MAIL_HOST` trống => `transporter` = null, `send()` chỉ log cảnh báo (KHÔNG throw,
 * không chặn luồng gọi — token vẫn được tạo/lưu thành công, chỉ là khâu gửi mail chưa cấu hình).
 * `MAIL_HOST` có giá trị => gửi email thật qua SMTP bất kể môi trường dev/production.
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: nodemailer.Transporter | null;
  private readonly mailConfig: MailConfig;
  private readonly appConfig: AppConfig;

  constructor(configService: ConfigService) {
    this.mailConfig = configService.get<MailConfig>('mail')!;
    this.appConfig = configService.get<AppConfig>('app')!;

    this.transporter = this.mailConfig.host
      ? nodemailer.createTransport({
          host: this.mailConfig.host,
          port: this.mailConfig.port,
          secure: this.mailConfig.secure,
          auth: this.mailConfig.user
            ? { user: this.mailConfig.user, pass: this.mailConfig.pass }
            : undefined,
        })
      : null;
  }

  get isConfigured(): boolean {
    return this.transporter !== null;
  }

  async send(options: SendMailOptions): Promise<void> {
    if (!this.transporter) {
      this.logger.warn(
        `SMTP chưa được cấu hình (MAIL_HOST trống) — không gửi được email thật tới ${options.to}. ` +
          'Xem MAIL_HOST/.env.example.',
      );
      return;
    }

    await this.transporter.sendMail({
      from: this.mailConfig.from,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });
  }

  /** Log token dev-only — CHỈ gọi khi `!isConfigured`, cùng pattern `forgotPassword` đã dùng
   * (`this.logger.debug`, gate `nodeEnv !== 'production'`, không lọt ra response API). */
  logDevToken(context: string, email: string, token: string): void {
    if (this.appConfig.nodeEnv !== 'production') {
      this.logger.debug(`[dev-only] ${context} cho ${email}: ${token}`);
    }
  }
}
