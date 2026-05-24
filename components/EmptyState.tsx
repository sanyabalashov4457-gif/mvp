import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type EmptyStateProps = {
  title: string;
  description: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
};

export const EmptyState = ({
  title,
  description,
  icon,
  action,
  className,
}: EmptyStateProps) => {
  return (
    <section
      className={cn(
        "flex min-h-[44vh] flex-col items-center justify-center rounded-[28px] border border-dashed border-border bg-card px-8 text-center",
        className,
      )}
    >
      {icon ? <div className="mb-4 text-muted">{icon}</div> : null}
      <h2 className="text-xl font-semibold tracking-tight text-primary">{title}</h2>
      <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted">{description}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </section>
  );
};
