import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { getModelToken } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { Model } from 'mongoose';
import { UserRole } from '../../common/constants';
import { AdminConfig } from '../../config/configuration';
import { User, UserDocument } from '../../users/schemas/user.schema';
import { SeedAdminModule } from './seed-admin.module';

const SALT_ROUNDS = 10;

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(SeedAdminModule);

  try {
    const configService = app.get(ConfigService);
    const adminConfig = configService.get<AdminConfig>('admin')!;

    if (!adminConfig.email || !adminConfig.password) {
      throw new Error(
        'ADMIN_EMAIL và ADMIN_PASSWORD phải được khai báo trong biến môi trường (.env) trước khi chạy seed.',
      );
    }

    const userModel = app.get<Model<UserDocument>>(getModelToken(User.name));

    const existing = await userModel.findOne({ email: adminConfig.email });
    if (existing) {
      // eslint-disable-next-line no-console
      console.log(`Tài khoản admin đã tồn tại: ${adminConfig.email} (bỏ qua seeding)`);
      return;
    }

    const passwordHash = await bcrypt.hash(adminConfig.password, SALT_ROUNDS);
    await userModel.create({
      email: adminConfig.email,
      password: passwordHash,
      name: adminConfig.name,
      role: UserRole.ADMIN,
      isActive: true,
    });

    // eslint-disable-next-line no-console
    console.log(`Đã tạo tài khoản admin: ${adminConfig.email} (mật khẩu lấy từ biến môi trường ADMIN_PASSWORD)`);
  } finally {
    await app.close();
  }
}

bootstrap();
