import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type RolePermissionDocument = RolePermission & Document;

@Schema({ timestamps: { createdAt: true, updatedAt: false }, collection: 'role_permissions' })
export class RolePermission {
  @Prop({ type: Types.ObjectId, ref: 'Role', required: true })
  role: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Permission', required: true })
  permission: Types.ObjectId;
}

export const RolePermissionSchema = SchemaFactory.createForClass(RolePermission);

RolePermissionSchema.index({ role: 1, permission: 1 }, { unique: true });
RolePermissionSchema.index({ permission: 1 });
