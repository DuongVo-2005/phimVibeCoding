import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AvatarsController } from './avatars.controller';
import { AvatarsService } from './avatars.service';
import { ImgAvatar, ImgAvatarSchema } from './schemas/img-avatar.schema';
import { TypeAvatar, TypeAvatarSchema } from './schemas/type-avatar.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TypeAvatar.name, schema: TypeAvatarSchema },
      { name: ImgAvatar.name, schema: ImgAvatarSchema },
    ]),
  ],
  controllers: [AvatarsController],
  providers: [AvatarsService],
  exports: [AvatarsService],
})
export class AvatarsModule {}
