import { IsInt, IsNotEmpty, IsOptional, Min } from 'class-validator';

export class CreateItemDto {
  @IsNotEmpty({ message: 'Item code is required.' })
  code: string;

  @IsNotEmpty({ message: 'Item name is required.' })
  name: string;

  @IsNotEmpty({ message: 'Category is required.' })
  category: string;

  @IsNotEmpty({ message: 'Unit is required (e.g. pcs, box, litre).' })
  unit: string;

  @IsOptional()
  @IsInt()
  @Min(0, { message: 'Opening quantity cannot be negative.' })
  currentQuantity?: number;

  @IsInt()
  @Min(0, { message: 'Minimum quantity cannot be negative.' })
  minQuantity: number;
}

export class UpdateItemDto {
  @IsOptional()
  @IsNotEmpty({ message: 'Item name cannot be empty.' })
  name?: string;

  @IsOptional()
  @IsNotEmpty({ message: 'Category cannot be empty.' })
  category?: string;

  @IsOptional()
  @IsNotEmpty({ message: 'Unit cannot be empty.' })
  unit?: string;

  @IsOptional()
  @IsInt()
  @Min(0, { message: 'Minimum quantity cannot be negative.' })
  minQuantity?: number;
}

export class FindItemsQueryDto {
  @IsOptional()
  search?: string; // matches against code or name

  @IsOptional()
  category?: string;

  @IsOptional()
  lowStockOnly?: string; // 'true' | 'false' (query params arrive as strings)
}
