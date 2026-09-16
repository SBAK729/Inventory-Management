import { IsIn, IsOptional } from 'class-validator';

const STATUSES = ['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'FULFILLED'] as const;

export class PurchaseRequestsReportQueryDto {
  @IsOptional()
  @IsIn(STATUSES, { message: `status must be one of ${STATUSES.join(', ')}` })
  status?: (typeof STATUSES)[number];

  @IsOptional()
  departmentId?: string; // arrives as a query string; parsed to a number in the service

  @IsOptional()
  from?: string; // ISO date, inclusive lower bound on requestDate

  @IsOptional()
  to?: string; // ISO date, inclusive upper bound on requestDate
}