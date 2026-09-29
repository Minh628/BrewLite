export type Size = 'S' | 'M' | 'L';

export type AvailableSize = {
    size: Size;
    extraPrice: number;
};

export type SelectedTopping = {
    price: number;
};

/**
 * Tính đơn giá một sản phẩm, chưa nhân số lượng.
 * base là Product.price (giá gốc size S).
 * size lấy từ ProductSize của sản phẩm đó.
 */
export function calcUnitPrice(
    base: number,
    size: AvailableSize,
    toppings: readonly SelectedTopping[],
): number {
    if (!Number.isFinite(base) || base < 0) {
        throw new RangeError('Giá gốc không hợp lệ');
    }

    if (!['S', 'M', 'L'].includes(size.size)) {
        throw new RangeError('Size không hợp lệ');
    }

    if (!Number.isFinite(size.extraPrice) || size.extraPrice < 0) {
        throw new RangeError('Phụ thu size không hợp lệ');
    }

    const toppingTotal = toppings.reduce((total, topping) => {
        if (!Number.isFinite(topping.price) || topping.price < 0) {
            throw new RangeError('Giá topping không hợp lệ');
        }

        return total + topping.price;
    }, 0);

    return Math.round(base + size.extraPrice + toppingTotal);
}


/*
import { calcUnitPrice } from '@/lib/pricing';

const unitPrice = calcUnitPrice(
    45_000,
    { size: 'L', extraPrice: 10_000 },
    [{ price: 5_000 }, { price: 7_000 }],
);
 */