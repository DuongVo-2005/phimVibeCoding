import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsMongoId } from 'class-validator';

export class SetRolePermissionsDto {
  @ApiProperty({ type: [String], description: 'Danh sách permissionId — thay thế toàn bộ tập hiện có' })
  @IsArray()
  @IsMongoId({ each: true })
  permissionIds: string[];
}
