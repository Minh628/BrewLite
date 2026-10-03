import Link from 'next/link';

export function Header() {
  return (
    <header className="sticky top-0 z-10 border-b border-espresso/10 bg-espresso text-crema">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 lg:px-10">
        <Link href="/" className="flex items-center gap-2 text-lg font-black tracking-tight">
          <span aria-hidden="true" className="text-2xl">
            ☕
          </span>
          BrewLite
        </Link>
        <Link
          href="/cart"
          aria-label="Xem giỏ hàng"
          className="relative flex h-10 w-10 items-center justify-center rounded-full border border-crema/30 text-xl transition hover:border-crema"
        >
          🛍️
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-caramel px-1 text-xs font-bold text-espresso">
            0
          </span>
        </Link>
      </div>
    </header>
  );
}
