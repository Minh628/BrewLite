// Nạp biến môi trường từ file .env vào process.env khi chạy script
import 'dotenv/config';
import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const BCRYPT_SALT_ROUNDS = 10;

async function main() {
  // 1. Seed Categories (id: 1, 2)
  const categories = [
    { id: 1, name: 'Cà phê' },
    { id: 2, name: 'Trà' },
  ];

  for (const category of categories) {
    await prisma.category.upsert({
      where: { id: category.id },
      update: { name: category.name },
      create: category,
    });
  }

  // 2. Seed Products (id: 1..4)
  const products = [
    {
      name: 'Ca phe sua',
      price: 35000,
      stock: 100,
      imageUrl: '/coffee-milk.svg',
      categoryId: 1,
    },
    {
      name: 'Americano',
      price: 40000,
      stock: 100,
      imageUrl: '/americano.svg',
      categoryId: 1,
    },
    {
      name: 'Cappuccino',
      price: 45000,
      stock: 100,
      imageUrl: '/cappuccino.svg',
      categoryId: 1,
    },
    {
      name: 'Tra dao',
      price: 39000,
      stock: 100,
      imageUrl: '/peach-tea.svg',
      categoryId: 2,
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

  // 3. Seed Toppings (id: 1..5)
  const toppings = [
    { id: 1, name: 'Trân châu đen', price: 5000 },
    { id: 2, name: 'Trân châu trắng', price: 7000 },
    { id: 3, name: 'Thạch trái cây', price: 6000 },
    { id: 4, name: 'Pudding trứng', price: 8000 },
    { id: 5, name: 'Kem Cheese', price: 10000 },
  ];

  for (const topping of toppings) {
    await prisma.topping.upsert({
      where: { id: topping.id },
      update: { name: topping.name, price: topping.price },
      create: topping,
    });
  }

  // 4. Liên kết Topping với từng sản phẩm (ProductTopping)
  const allProducts = await prisma.product.findMany();
  const allToppings = await prisma.topping.findMany();

  for (const prod of allProducts) {
    for (const top of allToppings) {
      await prisma.productTopping.upsert({
        where: { productId_toppingId: { productId: prod.id, toppingId: top.id } },
        update: {},
        create: { productId: prod.id, toppingId: top.id },
      });
    }
  }

  // 5. Seed Test Users theo đặc tả Sprint 2 (Sub-task 7.1)
  const testUsers = [
    {
      email: 'an@brewlite.vn',
      rawPassword: 'matkhau123',
      role: Role.CUSTOMER,
      loyaltyPoints: 0,
    },
    {
      email: 'customer@brewlite.vn',
      rawPassword: 'Password123',
      role: Role.CUSTOMER,
      loyaltyPoints: 0,
    },
  ];

  for (const user of testUsers) {
    const passwordHash = await bcrypt.hash(user.rawPassword, BCRYPT_SALT_ROUNDS);

    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        passwordHash,
        role: user.role,
        loyaltyPoints: user.loyaltyPoints,
      },
      create: {
        email: user.email,
        passwordHash,
        role: user.role,
        loyaltyPoints: user.loyaltyPoints,
      },
    });
  }
}

main()
  .then(() => {
    console.log('Seeding completed successfully!');
  })
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
