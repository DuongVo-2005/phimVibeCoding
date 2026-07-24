import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Actor, ActorSchema } from './schemas/actor.schema';
import { ActorsController } from './actors.controller';
import { ActorsService } from './actors.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: Actor.name, schema: ActorSchema }])],
  controllers: [ActorsController],
  providers: [ActorsService],
  exports: [ActorsService],
})
export class ActorsModule {}
