import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DirectorsController } from './directors.controller';
import { DirectorsService } from './directors.service';
import { Director, DirectorSchema } from './schemas/director.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Director.name, schema: DirectorSchema }])],
  controllers: [DirectorsController],
  providers: [DirectorsService],
  exports: [DirectorsService],
})
export class DirectorsModule {}
