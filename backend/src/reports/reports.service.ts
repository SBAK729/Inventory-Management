import { Injectable } from '@nestjs/common';
import { Prisma, Role } from '../prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../common/decorators/current-user.decorator';
import { PurchaseRequestsReportQueryDto } from './dto/purchase-requests-report-query.dto';
import { StockTransactionsReportQueryDto } from './dto/stock-transactions-report-query.dto';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  // Report 1: Item List — every active item and its basic details.
  itemList() {
    return this.prisma.item.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  // Report 2: Current Stock — same data, framed around quantity on hand.
  currentStock() {
    return this.prisma.item.findMany({
      where: { isActive: true },
      select: {
        code: true,
        name: true,
        category: true,
        unit: true,
        currentQuantity: true,
        minQuantity: true,
      },
      orderBy: { currentQuantity: 'asc' },
    });
  }

  // Report 3: Low Stock — items at or below their minimum quantity.
  async lowStock() {
    const items = await this.prisma.item.findMany({ where: { isActive: true } });
    return items.filter((i) => i.currentQuantity <= i.minQuantity);
  }

  // Report 4: Purchase Requests — filterable by status, department, and date range.
  // Managers are automatically scoped to their own department; Admin/Storekeeper see all.
  purchaseRequests(query: PurchaseRequestsReportQueryDto, user: AuthUser) {
    const where: Prisma.PurchaseRequestWhereInput = {};

    if (query.status) {
      where.status = query.status as any;
    }

    if (query.departmentId) {
      where.departmentId = Number(query.departmentId);
    }

    if (user.role === Role.MANAGER) {
      // A manager only ever sees their own department's requests, regardless
      // of what departmentId they pass in.
      where.departmentId = user.departmentId ?? -1;
    }

    if (query.from || query.to) {
      where.requestDate = {
        ...(query.from ? { gte: new Date(query.from) } : {}),
        ...(query.to ? { lte: new Date(query.to) } : {}),
      };
    }

    return this.prisma.purchaseRequest.findMany({
      where,
      include: {
        requester: { select: { id: true, fullName: true, email: true } },
        department: { select: { id: true, name: true } },
        lineItems: { include: { item: { select: { code: true, name: true, unit: true } } } },
      },
      orderBy: { requestDate: 'desc' },
    });
  }

  // Report 5: Stock Transactions — the full receipt/issue log, filterable.
  stockTransactions(query: StockTransactionsReportQueryDto) {
    const where: Prisma.StockTransactionWhereInput = {};

    if (query.type) {
      where.type = query.type as any;
    }
    if (query.itemCode) {
      where.item = { code: query.itemCode };
    }
    if (query.from || query.to) {
      where.date = {
        ...(query.from ? { gte: new Date(query.from) } : {}),
        ...(query.to ? { lte: new Date(query.to) } : {}),
      };
    }

    return this.prisma.stockTransaction.findMany({
      where,
      include: {
        item: { select: { code: true, name: true, unit: true } },
        performedBy: { select: { id: true, fullName: true } },
        purchaseRequest: { select: { id: true, requestNumber: true } },
      },
      orderBy: { date: 'desc' },
    });
  }
}