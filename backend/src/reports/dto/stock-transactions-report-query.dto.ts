import { IsIn, IsOptional } from 'class-validator';

const TYPES = ['RECEIPT', 'ISSUE'] as const;

export class StockTransactionsReportQueryDto {
  @IsOptional()
  itemCode?: string;

  @IsOptional()
  @IsIn(TYPES, { message: `type must be one of ${TYPES.join(', ')}` })
  type?: (typeof TYPES)[number];

  @IsOptional()
  from?: string; // ISO date, inclusive lower bound

  @IsOptional()
  to?: string; // ISO date, inclusive upper bound
}