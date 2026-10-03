import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';
import eslintConfigPrettier from 'eslint-config-prettier';

const filename = fileURLToPath(import.meta.url);
const directory = dirname(filename);
const compat = new FlatCompat({ baseDirectory: directory });

const eslintConfig = [
  ...compat.extends('next/core-web-vitals'),
  eslintConfigPrettier,
  {
    settings: {
      next: {
        // Chỉ định rootDir để Next.js plugin nhận diện đúng thư mục khi chạy từ root hoặc workspace
        rootDir: ['frontend/', './'],
      },
    },
    rules: {
      '@next/next/no-html-link-for-pages': 'off',
    },
  },
  {
    // Bỏ qua các thư mục build và bộ nhớ tạm
    ignores: ['.next/**', 'node_modules/**', 'dist/**'],
  },
];

export default eslintConfig;
