import type { ReactNode } from 'react';

export default function ReceptionLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b bg-card/90 px-4 py-3 backdrop-blur">
        <div className="flex flex-col">
          <span className="text-xs font-medium text-muted-foreground">Welcome to</span>
          <span className="text-base font-semibold text-foreground">Property Reception</span>
        </div>
        <button className="rounded-full border px-3 py-1 text-xs font-medium text-foreground hover:bg-accent">
          Need help?
        </button>
      </header>
      <main className="mx-auto max-w-md px-4 py-4">{children}</main>
    </div>
  );
}

