import { PartialType } from '@nestjs/swagger';
import { IsString, IsNumber, IsNotEmpty, IsEmail } from 'class-validator';

export class UserDto {
  readonly id: string;
  @IsString()
  @IsNotEmpty()
  readonly full_name: string;

  @IsEmail()
  @IsNotEmpty()
  readonly email: string;

  @IsString()
  @IsNotEmpty()
  readonly password: string;

  @IsNumber()
  @IsNotEmpty()
  readonly phone: number;

  @IsString()
  @IsNotEmpty()
  readonly role: string;

  readonly is_delete: boolean;
  readonly created_at: Date;
  readonly updated_at: Date;
}

export class UserLoginDto {
  @IsEmail()
  @IsNotEmpty()
  readonly email: string;

  @IsString()
  @IsNotEmpty()
  readonly password: string;
}

export class UserUpdateDto extends PartialType(UserDto) {}
