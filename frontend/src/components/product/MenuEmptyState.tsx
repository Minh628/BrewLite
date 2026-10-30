export function MenuEmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div className="rounded-3xl border border-dashed border-espresso/25 p-12 text-center">
      <p className="text-lg font-bold text-espresso">Không tìm thấy món phù hợp</p>
      <p className="mt-1 text-sm text-sage">
        Thử từ khóa khác hoặc chọn lại danh mục để xem toàn bộ menu.
      </p>
      <button
        type="button"
        onClick={onReset}
        className="mt-5 rounded-lg bg-caramel px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-caramel/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-caramel"
      >
        Xóa bộ lọc
      </button>
    </div>
  );
}
