import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Role, RequestStatus } from '../prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../common/decorators/current-user.decorator';
import { CreatePurchaseRequestDto } from './dto/create-purchase-request.dto';
import { UpdatePurchaseRequestDto } from './dto/update-purchase-request.dto';

const REQUEST_INCLUDE = {
  requester: { select: { id: true, fullName: true, email: true } },
  department: { select: { id: true, name: true } },
  approver: { select: { id: true, fullName: true, email: true } },
  lineItems: {
    include: { item: { select: { id: true, code: true, name: true, unit: true } } },
  },
} as const;

@Injectable()
export class PurchaseRequestsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreatePurchaseRequestDto, user: AuthUser) {
    if (!user.departmentId) {
      throw new BadRequestException(
        'You must belong to a department before you can create a purchase request.',
      );
    }

    // Reject duplicate item codes within the same request up front, with a
    // clear message, rather than letting the DB unique constraint fail later.
    const codes = dto.lineItems.map((li) => li.itemCode);
    const uniqueCodes = new Set(codes);
    if (uniqueCodes.size !== codes.length) {
      throw new BadRequestException('Each item can only appear once per request.');
    }

    const items = await this.prisma.item.findMany({
      where: { code: { in: [...uniqueCodes] }, isActive: true },
    });
    const foundCodes = new Set(items.map((i) => i.code));
    const missing = codes.filter((c) => !foundCodes.has(c));
    if (missing.length > 0) {
      throw new BadRequestException(
        `The following item code(s) do not exist: ${missing.join(', ')}`,
      );
    }
    const itemByCode = new Map(items.map((i) => [i.code, i]));

    // Create the request, then stamp a human-readable request number derived
    // from its own id — guarantees uniqueness without a separate counter table.
    const created = await this.prisma.$transaction(async (tx) => {
      const request = await tx.purchaseRequest.create({
        data: {
          purpose: dto.purpose,
          requesterId: user.userId,
          departmentId: user.departmentId!,
          requestNumber: `PENDING-${crypto.randomUUID()}`,
          lineItems: {
            create: dto.lineItems.map((li) => ({
              itemId: itemByCode.get(li.itemCode)!.id,
              requestedQuantity: li.requestedQuantity,
            })),
          },
        },
      });

      const year = request.requestDate.getFullYear();
      const requestNumber = `PR-${year}-${String(request.id).padStart(4, '0')}`;

      return tx.purchaseRequest.update({
        where: { id: request.id },
        data: { requestNumber },
        include: REQUEST_INCLUDE,
      });
    });

    return created;
  }

  // Requests created by the currently logged-in employee.
  findMine(user: AuthUser) {
    return this.prisma.purchaseRequest.findMany({
      where: { requesterId: user.userId },
      include: REQUEST_INCLUDE,
      orderBy: { requestDate: 'desc' },
    });
  }
  findPendingApprovals(user: AuthUser) {
    return this.prisma.purchaseRequest.findMany({
      where: {
        status: RequestStatus.SUBMITTED,
        department: { managerId: user.userId },
      },
      include: REQUEST_INCLUDE,
      orderBy: { requestDate: 'asc' },
    });
  }

  findApprovedAwaitingFulfillment() {
    return this.prisma.purchaseRequest.findMany({
      where: { status: RequestStatus.APPROVED },
      include: REQUEST_INCLUDE,
      orderBy: { decidedAt: 'asc' },
    });
  }

  findAllForAdmin(status?: RequestStatus) {
    return this.prisma.purchaseRequest.findMany({
      where: status ? { status } : undefined,
      include: REQUEST_INCLUDE,
      orderBy: { requestDate: 'desc' },
    });
  }
  async findOne(id: number, user: AuthUser) {
    const request = await this.prisma.purchaseRequest.findUnique({
      where: { id },
      include: REQUEST_INCLUDE,
    });
    if (!request) {
      throw new NotFoundException(`Purchase request with id ${id} was not found.`);
    }

    // Visibility: the requester who owns it, their department manager,
    // storekeepers/admins (who need to see everything) may view it.
    const canView =
      request.requesterId === user.userId ||
      user.role === Role.ADMIN ||
      user.role === Role.STOREKEEPER ||
      (user.role === Role.MANAGER && request.departmentId === user.departmentId);

    if (!canView) {
      throw new ForbiddenException('You do not have permission to view this request.');
    }

    return request;
  }

  async submit(id: number, user: AuthUser) {
    const request = await this.prisma.purchaseRequest.findUnique({ where: { id } });
    if (!request) {
      throw new NotFoundException(`Purchase request with id ${id} was not found.`);
    }

    if (request.requesterId !== user.userId) {
      throw new ForbiddenException('You can only submit your own purchase requests.');
    }

    if (request.status !== RequestStatus.DRAFT) {
      throw new BadRequestException(
        `Only requests in Draft status can be submitted. This request is currently ${request.status}.`,
      );
    }

    return this.prisma.purchaseRequest.update({
      where: { id },
      data: { status: RequestStatus.SUBMITTED },
      include: REQUEST_INCLUDE,
    });
  }
  async update(id: number, dto: UpdatePurchaseRequestDto, user: AuthUser) {
    const request = await this.prisma.purchaseRequest.findUnique({ where: { id } });
    if (!request) {
      throw new NotFoundException(`Purchase request with id ${id} was not found.`);
    }
    if (request.requesterId !== user.userId) {
      throw new ForbiddenException('You can only edit your own purchase requests.');
    }
    if (request.status !== RequestStatus.DRAFT) {
      throw new BadRequestException(
        `Only requests in Draft status can be edited. This request is currently ${request.status}.`,
      );
    }

    let itemByCode: Map<string, { id: number }> | null = null;
    if (dto.lineItems) {
      const codes = dto.lineItems.map((li) => li.itemCode);
      const uniqueCodes = new Set(codes);
      if (uniqueCodes.size !== codes.length) {
        throw new BadRequestException('Each item can only appear once per request.');
      }
      const items = await this.prisma.item.findMany({
        where: { code: { in: [...uniqueCodes] }, isActive: true },
      });
      const foundCodes = new Set(items.map((i) => i.code));
      const missing = codes.filter((c) => !foundCodes.has(c));
      if (missing.length > 0) {
        throw new BadRequestException(
          `The following item code(s) do not exist: ${missing.join(', ')}`,
        );
      }
      itemByCode = new Map(items.map((i) => [i.code, i]));
    }

    return this.prisma.$transaction(async (tx) => {
      if (dto.lineItems && itemByCode) {
        // Replace the whole line-item set rather than trying to diff it —
        // simpler and safer for a Draft, which has no issued quantities yet.
        await tx.requestLineItem.deleteMany({ where: { purchaseRequestId: id } });
        await tx.requestLineItem.createMany({
          data: dto.lineItems.map((li) => ({
            purchaseRequestId: id,
            itemId: itemByCode!.get(li.itemCode)!.id,
            requestedQuantity: li.requestedQuantity,
          })),
        });
      }

      return tx.purchaseRequest.update({
        where: { id },
        data: dto.purpose ? { purpose: dto.purpose } : {},
        include: REQUEST_INCLUDE,
      });
    });
  }

  async cancel(id: number, user: AuthUser) {
    const request = await this.prisma.purchaseRequest.findUnique({ where: { id } });
    if (!request) {
      throw new NotFoundException(`Purchase request with id ${id} was not found.`);
    }
    if (request.requesterId !== user.userId) {
      throw new ForbiddenException('You can only cancel your own purchase requests.');
    }
    if (request.status !== RequestStatus.DRAFT) {
      throw new BadRequestException(
        `Only requests in Draft status can be cancelled. This request is currently ${request.status}.`,
      );
    }

    // request_line_items has ON DELETE CASCADE, so its rows go with it.
    await this.prisma.purchaseRequest.delete({ where: { id } });
    return { deleted: true, id };
  }

  async approve(id: number, user: AuthUser) {
    await this.assertManagerCanDecide(id, user);

    return this.prisma.purchaseRequest.update({
      where: { id },
      data: {
        status: RequestStatus.APPROVED,
        approverId: user.userId,
        decidedAt: new Date(),
      },
      include: REQUEST_INCLUDE,
    });
  }

  async reject(id: number, user: AuthUser, reason?: string) {
    await this.assertManagerCanDecide(id, user);

    return this.prisma.purchaseRequest.update({
      where: { id },
      data: {
        status: RequestStatus.REJECTED,
        approverId: user.userId,
        decidedAt: new Date(),
        rejectionReason: reason ?? null,
      },
      include: REQUEST_INCLUDE,
    });
  }

  // Shared checks for approve/reject: request must exist, be Submitted, and
  // the acting user must be the manager of the request's own department.
  private async assertManagerCanDecide(id: number, user: AuthUser) {
    const request = await this.prisma.purchaseRequest.findUnique({
      where: { id },
      include: { department: true },
    });
    if (!request) {
      throw new NotFoundException(`Purchase request with id ${id} was not found.`);
    }

    if (request.status !== RequestStatus.SUBMITTED) {
      throw new BadRequestException(
        `Only requests in Submitted status can be approved or rejected. This request is currently ${request.status}.`,
      );
    }

    if (request.department.managerId !== user.userId) {
      throw new ForbiddenException(
        'Only the department manager for this request may approve or reject it.',
      );
    }

    return request;
  }
}