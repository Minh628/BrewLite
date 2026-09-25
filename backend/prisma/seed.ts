import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const products = [
        { name: 'Ca phe sua', price: 35000, stock: 100, imageUrl: '/coffee-milk.svg' },
        { name: 'Americano', price: 40000, stock: 100, imageUrl: '/americano.svg' },
        { name: 'Cappuccino', price: 45000, stock: 100, imageUrl: '/cappuccino.svg' },
        { name: 'Tra dao', price: 39000, stock: 100, imageUrl: '/peach-tea.svg' }
    ];

    for (const product of products) {
        await prisma.product.upsert({
            where: { name: product.name },
            update: product,
            create: product
        });
    }
}

main()
    .finally(async () => prisma.$disconnect());
