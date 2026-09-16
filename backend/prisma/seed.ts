import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';
import { PrismaClient, Role } from '../generated/prisma/client';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set.');
}
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding initial data...');

  // --- Departments ---------------------------------------------------
  const procurement = await prisma.department.upsert({
    where: { name: 'Procurement' },
    update: {},
    create: { name: 'Procurement' },
  });

  const operations = await prisma.department.upsert({
    where: { name: 'Operations' },
    update: {},
    create: { name: 'Operations' },
  });

  // --- Users -----------------------------------------------------------
  const passwordHash = await bcrypt.hash('ChangeMe123!', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'sinbikila729@gmail.com' },
    update: {},
    create: {
      fullName: 'Sintayehu Bikila',
      email: 'sinbikila729@gmail.com',
      passwordHash,
      role: Role.ADMIN,
      mustChangePassword: false,
    },
  });

  const manager = await prisma.user.upsert({
    where: { email: 'manager@gmail.com' },
    update: {},
    create: {
      fullName: 'Operations Manager',
      email: 'manager@gmail.com',
      passwordHash,
      role: Role.MANAGER,
      departmentId: operations.id,
      mustChangePassword: true,
    },
  });

  // Set this manager as the department's manager
  await prisma.department.update({
    where: { id: operations.id },
    data: { managerId: manager.id },
  });

  await prisma.user.upsert({
    where: { email: 'employee@gmail.com' },
    update: {},
    create: {
      fullName: 'Sample Employee',
      email: 'employee@gmail.com',
      passwordHash,
      role: Role.EMPLOYEE,
      departmentId: operations.id,
      mustChangePassword: true,
    },
  });

  await prisma.user.upsert({
    where: { email: 'storekeeper@gmail.com' },
    update: {},
    create: {
      fullName: 'Store Keeper',
      email: 'storekeeper@gmail.com',
      passwordHash,
      role: Role.STOREKEEPER,
      departmentId: procurement.id,
      mustChangePassword: true,
    },
  });

  // --- Sample items ------------------------------------------------------
  await prisma.item.upsert({
    where: { code: 'ITM-001' },
    update: {},
    create: {
      code: 'ITM-001',
      name: 'A4 Printer Paper (Ream)',
      category: 'Stationery',
      unit: 'ream',
      currentQuantity: 50,
      minQuantity: 10,
    },
  });

  await prisma.item.upsert({
    where: { code: 'ITM-002' },
    update: {},
    create: {
      code: 'ITM-002',
      name: 'HDMI Cable 2m',
      category: 'IT Equipment',
      unit: 'pcs',
      currentQuantity: 5,
      minQuantity: 8, // intentionally below minimum, to test the Low Stock report
    },
  });

  console.log('Seed complete.');
  console.log('Login with any of:');
  console.log('  admin@otech.local / ChangeMe123!');
  console.log('  manager@otech.local / ChangeMe123!');
  console.log('  employee@otech.local / ChangeMe123!');
  console.log('  storekeeper@otech.local / ChangeMe123!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });