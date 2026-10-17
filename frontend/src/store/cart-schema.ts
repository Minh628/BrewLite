import { z } from 'zod';

const CartToppingSchema = z.object({
  id: z.string(),
  name: z.string(),
  price: z.number().finite().nonnegative(),
});

const CategorySchema = z.object({
  id: z.number().int(),
  name: z.string(),
});

const ProductSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  price: z.number().finite().nonnegative(),
  imageUrl: z.string(),
  category: CategorySchema,
  isAvailable: z.boolean(),
});

const CartLineSchema = ProductSchema.extend({
  cartId: z.string(),
  size: z.enum(['S', 'M', 'L']),
  sizeExtra: z.number().finite().nonnegative(),
  toppings: z.array(CartToppingSchema),
  quantity: z.number().int().min(1).max(20),
  unitPrice: z.number().finite().nonnegative(),
});

export const CartStorageSchema = z.object({
  state: z.object({
    lines: z.array(CartLineSchema),
  }),
  version: z.number().int(),
});