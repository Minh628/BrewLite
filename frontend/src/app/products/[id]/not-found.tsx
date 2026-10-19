import React from 'react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6">
      <h1 className="text-6xl font-bold text-gray-800 mb-2">404</h1>
      <h2 className="text-2xl font-semibold text-gray-600 mb-4">
        Không tìm thấy sản phẩm
      </h2>
      <p className="text-gray-500 mb-6 max-w-md">
        Sản phẩm bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.
      </p>
      <Link
        href="/products"
        className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
      >
        Quay lại danh sách sản phẩm
      </Link>
    </div>
  );
}