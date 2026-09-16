import { Role } from '../../prisma/client';
import { IsEmail, IsEnum, IsInt, IsNotEmpty, IsOptional, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty({ message: 'Full name is required.' })
  fullName: string;

  @IsEmail({}, { message: 'Please provide a valid email address.' })
  email: string;

  @MinLength(6, { message: 'Password must be at least 6 characters.' })
  password: string;

  @IsEnum(Role, { message: 'Role must be one of ADMIN, EMPLOYEE, MANAGER, STOREKEEPER.' })
  role: Role;

  @IsOptional()
  @IsInt({ message: 'departmentId must be a valid department id.' })
  departmentId?: number;
}
