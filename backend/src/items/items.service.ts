import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateItemDto, FindItemsQueryDto, UpdateItemDto } from './dto/item.dto';

@Injectable()
export class ItemsService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateItemDto) {
    return this.prisma.item.create({
      data: {
        code: dto.code,
        name: dto.name,
        category: dto.category,
        unit: dto.unit,
        currentQuantity: dto.currentQuantity ?? 0,
        minQuantity: dto.minQuantity,
      },
    });
  }

  // Backs the item list, and doubles as the search/filtering feature (FR-10):
  // ?search=cable filters by code or name; ?category=Stationery filters by
  // category; ?lowStockOnly=true returns only items at/below minimum.
  findAll(query: FindItemsQueryDto) {
    const where: Prisma.ItemWhereInput = { isActive: true };

    if (query.search) {
      where.OR = [
        { code: { contains: query.search, mode: 'insensitive' } },
        { name: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query.category) {
      where.category = { equals: query.category, mode: 'insensitive' };
    }

    return this.prisma.item
      .findMany({ where, orderBy: { name: 'asc' } })
      .then((items) =>
        query.lowStockOnly === 'true'
          ? items.filter((i) => i.currentQuantity <= i.minQuantity)
          : items,
      );
  }

  async findOne(id: number) {
    const item = await this.prisma.item.findUnique({ where: { id } });
    if (!item) {
      throw new NotFoundException(`Item with id ${id} was not found.`);
    }
    return item;
  }

  async findByCode(code: string) {
    const item = await this.prisma.item.findUnique({ where: { code } });
    if (!item) {
      throw new NotFoundException(`Item with code "${code}" was not found.`);
    }
    return item;
  }

  async update(id: number, dto: UpdateItemDto) {
    await this.findOne(id);
    return this.prisma.item.update({ where: { id }, data: dto });
  }

  async remove(id: number) {
    await this.findOne(id);
    // Soft delete: items already referenced by historical requests/transactions
    // must not disappear from those records.
    return this.prisma.item.update({ where: { id }, data: { isActive: false } });
  }
}
