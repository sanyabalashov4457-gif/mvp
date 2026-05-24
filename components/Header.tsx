import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type HeaderProps = {
  title: string;
  subtitle?: string;
  rightSlot?: ReactNode;
  className?: string;
  subtitleClassName?: string;
};

export const Header = ({
  title,
  subtitle,
  rightSlot,
  className,
  subtitleClassName,
}: HeaderProps) => {
  return (
    <header className={cn("mb-5 flex items-start justify-between gap-4", className)}>
      <div>
        <h1 className="text-[1.05rem] font-semibold uppercase tracking-[0.12em] text-primary">
          {title}
        </h1>
        {subtitle ? (
          <p className={cn("mt-1 text-sm text-muted", subtitleClassName)}>{subtitle}</p>
        ) : null}
      </div>
      {rightSlot ? <div className="pt-0.5">{rightSlot}</div> : null}
    </header>
  );
};
