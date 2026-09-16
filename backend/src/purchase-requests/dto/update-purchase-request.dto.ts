import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
import { RequestLineItemDto } from './create-purchase-request.dto';

export class UpdatePurchaseRequestDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'Purpose cannot be empty.' })
  purpose?: string;

  // If provided, this REPLACES the request's entire set of line items.
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1, { message: 'A request must contain at least one item.' })
  @ValidateNested({ each: true })
  @Type(() => RequestLineItemDto)
  lineItems?: RequestLineItemDto[];
}