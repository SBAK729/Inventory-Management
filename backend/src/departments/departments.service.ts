import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDepartmentDto, UpdateDepartmentDto } from './dto/department.dto';

@Injectable()
export class DepartmentsService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateDepartmentDto) {
    return this.prisma.department.create({
      data: { name: dto.name, managerId: dto.managerId ?? null },
      include: { manager: { select: { id: true, fullName: true, email: true } } },
    });
  }

  findAll() {
    return this.prisma.department.findMany({
      include: { manager: { select: { id: true, fullName: true, email: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: number) {
    const department = await this.prisma.department.findUnique({
      where: { id },
      include: { manager: { select: { id: true, fullName: true, email: true } } },
    });
    if (!department) {
      throw new NotFoundException(`Department with id ${id} was not found.`);
    }
    return department;
  }

  async update(id: number, dto: UpdateDepartmentDto) {
    await this.findOne(id);
    return this.prisma.department.update({
      where: { id },
      data: dto,
      include: { manager: { select: { id: true, fullName: true, email: true } } },
    });
  }

  async remove(id: number) {
    await this.findOne(id);

    const [userCount, requestCount] = await Promise.all([
      this.prisma.user.count({ where: { departmentId: id } }),
      this.prisma.purchaseRequest.count({ where: { departmentId: id } }),
    ]);

    if (userCount > 0 || requestCount > 0) {
      throw new ConflictException(
        `Cannot delete this department: ${userCount} user(s) and ${requestCount} purchase request(s) ` +
          `are still attached to it. Reassign or remove those first.`,
      );
    }

    return this.prisma.department.delete({ where: { id } });
  }
}
