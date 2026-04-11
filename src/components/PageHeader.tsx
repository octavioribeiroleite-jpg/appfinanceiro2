import { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  children?: ReactNode;
}

export default function PageHeader({ title, children }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <h1 className="text-xl font-semibold sm:text-2xl">{title}</h1>
      {children && <div className="flex items-center gap-2 shrink-0">{children}</div>}
    </div>
  );
}
