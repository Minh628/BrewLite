'use client';

import Link from 'next/link';
import { Button } from '@/components/Button';

interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  actionLabel: string;
  actionHref: string;
}

export function EmptyState({ icon, title, description, actionLabel, actionHref }: EmptyStateProps) {
  return (
    <div className="text-center py-16 px-4">
      <div className="text-6xl mb-4">{icon}</div>
      <h2 className="text-xl font-bold text-espresso mb-2">{title}</h2>
      <p className="text-espresso/60 mb-6 max-w-md mx-auto">{description}</p>
      <Link href={actionHref}>
        <Button variant="primary">{actionLabel}</Button>
      </Link>
    </div>
  );
}
