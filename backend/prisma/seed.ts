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
    const savedProduct = await prisma.product.upsert({
      where: { name: product.name },
      update: product,
      create: product,
    });

    for (const [size, extraPrice] of [
      ['S', 0],
      ['M', 5000],
      ['L', 10000],
    ] as const) {
      await prisma.productSize.upsert({
        where: { productId_size: { productId: savedProduct.id, size } },
        update: { extraPrice },
        create: { productId: savedProduct.id, size, extraPrice },
      });
    }
  }

  const toppings = [
    { name: 'Trân châu đen', price: 5000 },
    { name: 'Trân châu trắng', price: 7000 },
    { name: 'Thạch trái cây', price: 6000 },
    { name: 'Pudding trứng', price: 8000 },
    { name: 'Kem Cheese', price: 10000 },
  ];

  for (const topping of toppings) {
    await prisma.topping.upsert({
      where: { name: topping.name },
      update: topping,
      create: topping,
    });
  }
}

main().finally(async () => prisma.$disconnect());
