import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
    title: 'BrewLite | Coffee, made simple',
    description: 'Cashless coffee ordering for BrewLite'
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        <html lang="vi">
            <body>
                <Providers>{children}</Providers>
            </body>
        </html>
    );
}
