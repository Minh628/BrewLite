'use client';

import type { Category } from '@/lib/api';

type MenuFiltersProps = {
  categories: Category[];
  selectedCategory: number | null;
  searchInput: string;
  onSelectCategory: (categoryId: number | null) => void;
  onSearchChange: (value: string) => void;
  onReset: () => void;
};

const tabBase =
  'whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-caramel';

export function MenuFilters({
  categories,
  selectedCategory,
  searchInput,
  onSelectCategory,
  onSearchChange,
  onReset,
}: MenuFiltersProps) {
  const hasFilters = selectedCategory !== null || searchInput.trim() !== '';

  return (
    <div className="mb-6 space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div
          role="tablist"
          aria-label="Lọc theo danh mục"
          className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1"
        >
          <button
            type="button"
            role="tab"
            aria-selected={selectedCategory === null}
            onClick={() => onSelectCategory(null)}
            className={`${tabBase} ${
              selectedCategory === null
                ? 'border-espresso bg-espresso text-crema'
                : 'border-espresso/25 bg-white text-espresso hover:border-espresso/50'
            }`}
          >
            Tất cả
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              role="tab"
              aria-selected={selectedCategory === category.id}
              onClick={() => onSelectCategory(category.id)}
              className={`${tabBase} ${
                selectedCategory === category.id
                  ? 'border-espresso bg-espresso text-crema'
                  : 'border-espresso/25 bg-white text-espresso hover:border-espresso/50'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>

        <div className="relative sm:w-72">
          <label htmlFor="menu-search" className="sr-only">
            Tìm món theo tên
          </label>
          <input
            id="menu-search"
            type="search"
            value={searchInput}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Tìm món, ví dụ: ca phe"
            className="w-full rounded-full border border-espresso/25 bg-white px-4 py-2 pr-10 text-sm text-espresso placeholder-espresso/40 transition-colors hover:border-espresso/50 focus:border-caramel focus:outline-none focus:ring-2 focus:ring-caramel/30"
            autoComplete="off"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              aria-label="Xóa từ khóa tìm kiếm"
              className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-espresso/50 transition-colors hover:bg-espresso/5 hover:text-espresso focus:outline-none focus-visible:ring-2 focus-visible:ring-caramel"
            >
              <span aria-hidden="true">×</span>
            </button>
          )}
        </div>
      </div>

      {hasFilters && (
        <button
          type="button"
          onClick={onReset}
          className="text-sm font-medium text-caramel hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-caramel"
        >
          Xóa bộ lọc
        </button>
      )}
    </div>
  );
}
