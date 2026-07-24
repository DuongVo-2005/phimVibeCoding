import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsMongoId } from 'class-validator';

export class SetUserRolesDto {
  @ApiProperty({
    type: [String],
    description: 'Thay thế toàn bộ tập role — mỗi user phải có ít nhất 1 role',
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsMongoId({ each: true })
  roleIds: string[];
}
