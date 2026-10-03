import React from 'react';

export default function Loading() {
  return (
    <div className="max-w-4xl mx-auto p-6 animate-pulse">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Skeleton Ảnh */}
        <div className="w-full h-80 bg-gray-200 rounded-lg"></div>

        {/* Skeleton Thông tin */}
        <div className="space-y-4">
          <div className="h-8 bg-gray-200 rounded w-3/4"></div>
          <div className="h-6 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-2 pt-4">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
          </div>
          <div className="h-12 bg-gray-200 rounded w-full mt-6"></div>
        </div>
      </div>
    </div>
  );
}