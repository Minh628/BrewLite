import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const categories = [
    { id: 'category-coffee', name: 'Cà phê' },
    { id: 'category-tea', name: 'Trà' },
  ];

  for (const category of categories) {
    await prisma.category.upsert({
      where: { id: category.id },
      update: { name: category.name },
      create: category,
    });
  }

  const products = [
    {
      name: 'Ca phe sua',
      price: 35000,
      stock: 100,
      imageUrl: '/coffee-milk.svg',
      categoryId: 'category-coffee',
    },
    {
      name: 'Americano',
      price: 40000,
      stock: 100,
      imageUrl: '/americano.svg',
      categoryId: 'category-coffee',
    },
    {
      name: 'Cappuccino',
      price: 45000,
      stock: 100,
      imageUrl: '/cappuccino.svg',
      categoryId: 'category-coffee',
    },
    {
      name: 'Tra dao',
      price: 39000,
      stock: 100,
      imageUrl: '/peach-tea.svg',
      categoryId: 'category-tea',
    },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { name: product.name },
      update: product,
      create: product,
    });
  }
}

main().finally(async () => prisma.$disconnect());
