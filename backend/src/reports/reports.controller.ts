import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { Role } from '../prisma/client';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { PurchaseRequestsReportQueryDto } from './dto/purchase-requests-report-query.dto';
import { StockTransactionsReportQueryDto } from './dto/stock-transactions-report-query.dto';
import { ReportsService } from './reports.service';

// Reports are for oversight roles — not needed by individual Employees, who
// already have GET /purchase-requests/mine for their own history.
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.MANAGER, Role.STOREKEEPER)
@Controller('reports')
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Get('items')
  itemList() {
    return this.reportsService.itemList();
  }

  @Get('stock/current')
  currentStock() {
    return this.reportsService.currentStock();
  }

  @Get('stock/low')
  lowStock() {
    return this.reportsService.lowStock();
  }

  @Get('purchase-requests')
  purchaseRequests(
    @Query() query: PurchaseRequestsReportQueryDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.reportsService.purchaseRequests(query, user);
  }

  @Get('stock/transactions')
  stockTransactions(@Query() query: StockTransactionsReportQueryDto) {
    return this.reportsService.stockTransactions(query);
  }
}