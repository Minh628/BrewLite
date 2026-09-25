export type Product = {
    id: string;
    name: string;
    price: number;
    imageUrl: string | null;
    stock: number;
};

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export async function getProducts(): Promise<Product[]> {
    const response = await fetch(`${apiUrl}/products`);
    if (!response.ok) throw new Error('Không thể tải menu lúc này.');
    return response.json() as Promise<Product[]>;
}
