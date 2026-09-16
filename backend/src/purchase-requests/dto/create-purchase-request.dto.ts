import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class RequestLineItemDto {
  @IsString()
  @IsNotEmpty({ message: 'itemCode is required for every line item.' })
  itemCode: string;

  @IsInt({ message: 'requestedQuantity must be a whole number.' })
  @Min(1, { message: 'requestedQuantity must be at least 1.' })
  requestedQuantity: number;
}

export class CreatePurchaseRequestDto {
  @IsString()
  @IsNotEmpty({ message: 'Purpose is required.' })
  purpose: string;

  @IsArray()
  @ArrayMinSize(1, { message: 'A request must contain at least one item.' })
  @ValidateNested({ each: true })
  @Type(() => RequestLineItemDto)
  lineItems: RequestLineItemDto[];
}