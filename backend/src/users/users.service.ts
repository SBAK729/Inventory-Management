import { Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

const SAFE_SELECT = {
  id: true,
  fullName: true,
  email: true,
  role: true,
  departmentId: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateUserDto) {
    const passwordHash = await bcrypt.hash(dto.password, 10);
    return this.prisma.user.create({
      data: {
        fullName: dto.fullName,
        email: dto.email,
        passwordHash,
        role: dto.role,
        departmentId: dto.departmentId ?? null,
      },
      select: SAFE_SELECT,
    });
  }

  findAll() {
    return this.prisma.user.findMany({
      select: SAFE_SELECT,
      orderBy: { fullName: 'asc' },
    });
  }

  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({ where: { id }, select: SAFE_SELECT });
    if (!user) {
      throw new NotFoundException(`User with id ${id} was not found.`);
    }
    return user;
  }

  async update(id: number, dto: UpdateUserDto) {
    await this.findOne(id);
    const data: any = { ...dto };
    if (dto.password) {
      data.passwordHash = await bcrypt.hash(dto.password, 10);
      delete data.password;
    }
    return this.prisma.user.update({ where: { id }, data, select: SAFE_SELECT });
  }

  async remove(id: number) {
    await this.findOne(id);
    // Soft delete: deactivate rather than hard-delete, so historical
    // requests/transactions referencing this user remain intact.
    return this.prisma.user.update({
      where: { id },
      data: { isActive: false },
      select: SAFE_SELECT,
    });
  }
}
