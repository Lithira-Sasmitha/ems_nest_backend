import { IsEmail, IsNotEmpty, IsOptional, MinLength } from 'class-validator';
import { UserRole } from '../../users/user.entity';

export class RegisterDto {
  @IsNotEmpty()
  name: string;

  @IsOptional()
  phoneNumber?: string;

  @IsOptional()
  nic?: string;

  @IsEmail()
  email: string;

  @MinLength(6)
  password: string;

  @IsOptional()
  role?: UserRole;
}
