export function ProductGridError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="rounded-3xl border border-caramel bg-caramel/10 p-12 text-center">
      <p className="text-lg font-bold text-espresso">Không tải được menu</p>
      <p className="mt-1 text-sm text-sage">Kiểm tra kết nối rồi thử lại.</p>
      <button
        onClick={onRetry}
        className="mt-4 rounded-full bg-espresso px-6 py-2 text-sm font-bold text-crema transition hover:bg-caramel"
      >
        Thử lại
      </button>
    </div>
  );
}
