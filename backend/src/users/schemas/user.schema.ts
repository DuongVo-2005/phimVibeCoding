import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Gender, UserRole } from '../../common/constants';

export type UserDocument = User & Document;

@Schema({ timestamps: true, collection: 'users' })
export class User {
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true, select: false })
  password: string;

  @Prop({ default: '' })
  name: string;

  @Prop({ type: String, enum: Gender, default: Gender.OTHER })
  gender: Gender;

  @Prop({ type: Types.ObjectId, ref: 'ImgAvatar', default: null })
  avatar: Types.ObjectId | null;

  @Prop({ type: String, enum: UserRole, default: UserRole.USER })
  role: UserRole;

  /** RBAC — danh sách role (collection `roles`) được gán cho user, dùng bởi PermissionsGuard. */
  @Prop({ type: [Types.ObjectId], ref: 'Role', default: [] })
  roleIds: Types.ObjectId[];

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: String, default: null, select: false })
  resetPasswordToken: string | null;

  @Prop({ type: Date, default: null, select: false })
  resetPasswordExpires: Date | null;

  @Prop({ type: String, default: null, select: false })
  refreshTokenHash: string | null;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.index({ roleIds: 1 });
