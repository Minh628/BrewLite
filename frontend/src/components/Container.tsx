import type { ReactNode } from 'react';

export function Container({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`mx-auto max-w-6xl px-6 lg:px-10 ${className}`.trim()}>{children}</div>;
}
