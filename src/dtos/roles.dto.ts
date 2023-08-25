import { IsNotEmpty, IsString } from 'class-validator';

export class RoleDto {
  readonly id: string;

  @IsString()
  @IsNotEmpty()
  readonly role: string;

  readonly is_delete: boolean;

  readonly created_at: Date;
  readonly updated_at: Date;
}
