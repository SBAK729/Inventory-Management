import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class RecordReceiptDto {
  @IsString()
  @IsNotEmpty({ message: 'itemCode is required.' })
  itemCode: string;

  @IsInt({ message: 'quantity must be a whole number.' })
  @Min(1, { message: 'quantity must be at least 1.' })
  quantity: number;
}

export class IssueStockDto {
  @IsString()
  @IsNotEmpty({ message: 'itemCode is required.' })
  itemCode: string;

  @IsInt({ message: 'quantity must be a whole number.' })
  @Min(1, { message: 'quantity must be at least 1.' })
  quantity: number;

  // Optional: link this issue to the purchase request it fulfils. When every
  // line item on that request has been fully issued, the request is marked
  // Fulfilled automatically.
  @IsOptional()
  @IsInt()
  purchaseRequestId?: number;
}