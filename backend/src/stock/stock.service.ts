import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { RequestStatus, TransactionType } from '../prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../common/decorators/current-user.decorator';
import { IssueStockDto, RecordReceiptDto } from './dto/stock-transaction.dto';

@Injectable()
export class StockService {
  constructor(private prisma: PrismaService) {}

  // Storekeeper logs stock arriving from a supplier: Current Stock += Received Qty.
  async recordReceipt(dto: RecordReceiptDto, user: AuthUser) {
    const item = await this.prisma.item.findUnique({ where: { code: dto.itemCode } });
    if (!item || !item.isActive) {
      throw new NotFoundException(`Item with code "${dto.itemCode}" was not found.`);
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedItem = await tx.item.update({
        where: { id: item.id },
        data: { currentQuantity: { increment: dto.quantity } },
      });

      const transaction = await tx.stockTransaction.create({
        data: {
          itemId: item.id,
          type: TransactionType.RECEIPT,
          quantity: dto.quantity,
          performedById: user.userId,
        },
      });

      return { transaction, item: updatedItem };
    });
  }

  // Storekeeper issues stock, optionally against an approved purchase request:
  // Current Stock -= Issued Qty. Never allowed to exceed what is available.
  async issueStock(dto: IssueStockDto, user: AuthUser) {
    const item = await this.prisma.item.findUnique({ where: { code: dto.itemCode } });
    if (!item || !item.isActive) {
      throw new NotFoundException(`Item with code "${dto.itemCode}" was not found.`);
    }

    // BR-06: stock can never be issued beyond what is currently available.
    if (dto.quantity > item.currentQuantity) {
      throw new BadRequestException(
        `Cannot issue ${dto.quantity} ${item.unit} of "${item.name}" — only ${item.currentQuantity} ${item.unit} currently available.`,
      );
    }

    let lineItem: { id: number; requestedQuantity: number; issuedQuantity: number } | null = null;

    if (dto.purchaseRequestId) {
      const request = await this.prisma.purchaseRequest.findUnique({
        where: { id: dto.purchaseRequestId },
        include: { lineItems: true },
      });
      if (!request) {
        throw new NotFoundException(
          `Purchase request with id ${dto.purchaseRequestId} was not found.`,
        );
      }
      if (request.status !== RequestStatus.APPROVED) {
        throw new BadRequestException(
          `Stock can only be issued against an Approved request. This request is currently ${request.status}.`,
        );
      }

      const match = request.lineItems.find((li) => li.itemId === item.id);
      if (!match) {
        throw new BadRequestException(
          `"${item.name}" is not one of the items on request ${request.requestNumber}.`,
        );
      }
      if (match.issuedQuantity + dto.quantity > match.requestedQuantity) {
        throw new BadRequestException(
          `This would issue more than requested for "${item.name}" on request ${request.requestNumber} ` +
            `(requested ${match.requestedQuantity}, already issued ${match.issuedQuantity}).`,
        );
      }
      lineItem = match;
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedItem = await tx.item.update({
        where: { id: item.id },
        data: { currentQuantity: { decrement: dto.quantity } },
      });

      const transaction = await tx.stockTransaction.create({
        data: {
          itemId: item.id,
          type: TransactionType.ISSUE,
          quantity: dto.quantity,
          performedById: user.userId,
          purchaseRequestId: dto.purchaseRequestId ?? null,
        },
      });

      if (lineItem) {
        await tx.requestLineItem.update({
          where: { id: lineItem.id },
          data: { issuedQuantity: { increment: dto.quantity } },
        });

        // If every line item on the request is now fully issued, mark it Fulfilled.
        const freshRequest = await tx.purchaseRequest.findUnique({
          where: { id: dto.purchaseRequestId },
          include: { lineItems: true },
        });
        const fullyIssued = freshRequest!.lineItems.every(
          (li) => li.issuedQuantity >= li.requestedQuantity,
        );
        if (fullyIssued) {
          await tx.purchaseRequest.update({
            where: { id: dto.purchaseRequestId },
            data: { status: RequestStatus.FULFILLED },
          });
        }
      }

      return { transaction, item: updatedItem };
    });
  }
}