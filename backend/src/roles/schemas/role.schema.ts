import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type RoleDocument = Role & Document;

@Schema({ timestamps: true, collection: 'roles' })
export class Role {
  @Prop({ required: true, unique: true, trim: true })
  name: string;

  @Prop({ default: '' })
  description: string;

  /** true cho các role hệ thống seed sẵn ("admin", "user") — không cho xoá/đổi tên. */
  @Prop({ default: false })
  isSystem: boolean;
}

export const RoleSchema = SchemaFactory.createForClass(Role);
