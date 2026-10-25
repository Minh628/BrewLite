/**
 * Dữ liệu sản phẩm mẫu dùng chung cho test đơn hàng.
 * Khớp ví dụ trong docs/api-contract.md v2: 2 × Cappuccino L + 2 topping (67.000) + 1 × Trà đào M (44.000) = 178.000
 */
const toppings = {
  pearl: { id: 1, name: 'Trân châu', price: 5000, isActive: true },
  cheese: { id: 2, name: 'Kem cheese', price: 7000, isActive: true },
  retired: { id: 9, name: 'Thạch ngừng bán', price: 3000, isActive: false },
};

const sizes = (productId: number) => [
  { productId, size: 'S', extraPrice: 0 },
  { productId, size: 'M', extraPrice: 5000 },
  { productId, size: 'L', extraPrice: 10000 },
];

export const productFixtures = [
  {
    id: 3,
    name: 'Cappuccino',
    price: 45000,
    sizes: sizes(3),
    toppings: [
      { productId: 3, toppingId: 1, topping: toppings.pearl },
      { productId: 3, toppingId: 2, topping: toppings.cheese },
      { productId: 3, toppingId: 9, topping: toppings.retired },
    ],
  },
  {
    id: 5,
    name: 'Trà đào',
    price: 39000,
    sizes: sizes(5),
    toppings: [],
  },
];

/**
 * Giả lập prisma.product.findMany: chỉ trả về sản phẩm có id nằm trong where.id.in
 */
export function findProductsByIds(args: { where: { id: { in: number[] } } }) {
  return Promise.resolve(productFixtures.filter((p) => args.where.id.in.includes(p.id)));
}

export const validOrderBody = {
  items: [
    { productId: 3, size: 'L', qty: 2, toppingIds: [1, 2] },
    { productId: 5, size: 'M', qty: 1, toppingIds: [] },
  ],
};

export const EXPECTED_TOTAL = 178000;
