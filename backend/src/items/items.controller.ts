import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Role } from '../prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateItemDto, FindItemsQueryDto, UpdateItemDto } from './dto/item.dto';
import { ItemsService } from './items.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('items')
export class ItemsController {
  constructor(private itemsService: ItemsService) {}

  // Any authenticated user can browse/search items (e.g. to build a request).
  @Get()
  findAll(@Query() query: FindItemsQueryDto) {
    return this.itemsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.itemsService.findOne(id);
  }

  // Only Administrators maintain item master data.
  @Roles(Role.ADMIN)
  @Post()
  create(@Body() dto: CreateItemDto) {
    return this.itemsService.create(dto);
  }

  @Roles(Role.ADMIN)
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateItemDto) {
    return this.itemsService.update(id, dto);
  }

  @Roles(Role.ADMIN)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.itemsService.remove(id);
  }
}
