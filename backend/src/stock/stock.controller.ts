import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { Role } from '../prisma/client';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { IssueStockDto, RecordReceiptDto } from './dto/stock-transaction.dto';
import { StockService } from './stock.service';

// Only the Storekeeper role manages physical stock movements (BR-07).
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.STOREKEEPER)
@Controller('stock')
export class StockController {
  constructor(private stockService: StockService) {}

  @Post('receipts')
  recordReceipt(@Body() dto: RecordReceiptDto, @CurrentUser() user: AuthUser) {
    return this.stockService.recordReceipt(dto, user);
  }

  @Post('issues')
  issueStock(@Body() dto: IssueStockDto, @CurrentUser() user: AuthUser) {
    return this.stockService.issueStock(dto, user);
  }
}