import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PermissionDocument = Permission & Document;

@Schema({ timestamps: true, collection: 'permissions' })
export class Permission {
  /** "resource:action", vd "films:create" — khoá tự nhiên, bất biến sau khi tạo. */
  @Prop({ required: true, unique: true, trim: true })
  key: string;

  @Prop({ required: true })
  resource: string;

  @Prop({ required: true })
  action: string;

  @Prop({ default: '' })
  description: string;
}

export const PermissionSchema = SchemaFactory.createForClass(Permission);
