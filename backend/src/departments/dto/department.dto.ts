import { IsInt, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateDepartmentDto {
  @IsNotEmpty({ message: 'Department name is required.' })
  name: string;

  @IsOptional()
  @IsInt({ message: 'managerId must be a valid user id.' })
  managerId?: number;
}

export class UpdateDepartmentDto {
  @IsOptional()
  @IsNotEmpty({ message: 'Department name cannot be empty.' })
  name?: string;

  @IsOptional()
  @IsInt({ message: 'managerId must be a valid user id.' })
  managerId?: number;
}
