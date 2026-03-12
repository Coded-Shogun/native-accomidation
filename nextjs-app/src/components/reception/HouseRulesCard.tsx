import { useState } from 'react';

interface HouseRulesCardProps {
  markdown: string;
}

export function HouseRulesCard({ markdown }: HouseRulesCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-lg border bg-card p-4">
      <button
        type="button"
        className="flex w-full items-center justify-between text-sm font-semibold text-card-foreground"
        onClick={() => setExpanded((v) => !v)}
      >
        House rules
        <span className="text-xs text-muted-foreground">{expanded ? 'Hide' : 'Show'}</span>
      </button>
      {expanded && (
        <div className="mt-2 space-y-1 text-sm text-muted-foreground whitespace-pre-wrap">
          {markdown}
        </div>
      )}
    </div>
  );
}

