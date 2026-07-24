import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoConfig } from '../config/configuration';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const mongoConfig = configService.get<MongoConfig>('mongo')!;
        return {
          uri: mongoConfig.uri,
        };
      },
    }),
  ],
})
export class DatabaseModule {}
