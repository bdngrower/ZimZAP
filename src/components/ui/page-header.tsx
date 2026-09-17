import React from 'react';

export function PageHeader({ title, description, children }: { title: string, description?: string, children?: React.ReactNode }) {
  return (
    <header className="flex-between mb-8">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary mb-1">{title}</h1>
        {description && <p className="text-sm text-text-secondary">{description}</p>}
      </div>
      {children && (
        <div className="flex items-center gap-3">
          {children}
        </div>
      )}
    </header>
  );
}
