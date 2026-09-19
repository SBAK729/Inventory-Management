import { Body, Controller,Query,  Get, Param, Delete, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { Role, RequestStatus } from '../prisma/client';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreatePurchaseRequestDto } from './dto/create-purchase-request.dto';
import { RejectPurchaseRequestDto } from './dto/reject-purchase-request.dto';
import { PurchaseRequestsService } from './purchase-requests.service';
import { UpdatePurchaseRequestDto } from './dto/update-purchase-request.dto';


@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('purchase-requests')
export class PurchaseRequestsController {
  constructor(private purchaseRequestsService: PurchaseRequestsService) {}

  // Employees (and managers, who may also need to request items) create requests.
  @Roles(Role.EMPLOYEE, Role.MANAGER)
  @Post("")
  create(@Body() dto: CreatePurchaseRequestDto, @CurrentUser() user: AuthUser) {
    return this.purchaseRequestsService.create(dto, user);
  }
  @Roles(Role.ADMIN)
  @Get()
  findAllForAdmin(@Query('status') status?: RequestStatus) {
    return this.purchaseRequestsService.findAllForAdmin(status);
  }
  // Any authenticated user can see their own request history.
  @Get('mine')
  findMine(@CurrentUser() user: AuthUser) {
    return this.purchaseRequestsService.findMine(user);
  }
    // Manager's queue of requests awaiting their decision.
  @Roles(Role.MANAGER)
  @Get('pending-approvals')
  findPendingApprovals(@CurrentUser() user: AuthUser) {
    return this.purchaseRequestsService.findPendingApprovals(user);
  }
  
  @Roles(Role.STOREKEEPER, Role.ADMIN)
  @Get('approved')
  findApprovedAwaitingFulfillment() {
    return this.purchaseRequestsService.findApprovedAwaitingFulfillment();
  }

  // Visibility rules (owner / their manager / storekeeper / admin) are
  // enforced in the service, not here.
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthUser) {
    return this.purchaseRequestsService.findOne(id, user);
  }

  @Roles(Role.EMPLOYEE, Role.MANAGER)
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePurchaseRequestDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.purchaseRequestsService.update(id, dto, user);
  }

  @Roles(Role.EMPLOYEE, Role.MANAGER)
  @Delete(':id')
  cancel(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthUser) {
    return this.purchaseRequestsService.cancel(id, user);
  }
  // Draft -> Submitted. Only the request's own owner may submit it.
  @Roles(Role.EMPLOYEE, Role.MANAGER)
  @Patch(':id/submit')
  submit(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthUser) {
    return this.purchaseRequestsService.submit(id, user);
  }

  // Submitted -> Approved. Manager-only; service checks it's THEIR department.
  @Roles(Role.MANAGER)
  @Patch(':id/approve')
  approve(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthUser) {
    return this.purchaseRequestsService.approve(id, user);
  }

  // Submitted -> Rejected, with an optional reason.
  @Roles(Role.MANAGER)
  @Patch(':id/reject')
  reject(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RejectPurchaseRequestDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.purchaseRequestsService.reject(id, user, dto.reason);
  }
}