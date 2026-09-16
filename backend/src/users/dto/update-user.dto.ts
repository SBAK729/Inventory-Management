import { Role } from '../../prisma/client';
import { IsBoolean, IsEmail, IsEnum, IsInt, IsNotEmpty, IsOptional, MinLength } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsNotEmpty({ message: 'Full name cannot be empty.' })
  fullName?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Please provide a valid email address.' })
  email?: string;

  @IsOptional()
  @MinLength(6, { message: 'Password must be at least 6 characters.' })
  password?: string;

  @IsOptional()
  @IsEnum(Role, { message: 'Role must be one of ADMIN, EMPLOYEE, MANAGER, STOREKEEPER.' })
  role?: Role;

  @IsOptional()
  @IsInt({ message: 'departmentId must be a valid department id.' })
  departmentId?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
