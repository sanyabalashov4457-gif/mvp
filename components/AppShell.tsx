import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { BottomNav } from "./BottomNav";

type AppShellProps = {
  children: ReactNode;
  withBottomNav?: boolean;
  contentClassName?: string;
};

export const AppShell = ({
  children,
  withBottomNav = true,
  contentClassName,
}: AppShellProps) => {
  return (
    <div className="min-h-screen bg-background px-0 sm:px-6 sm:py-6">
      <div className="mx-auto flex min-h-screen w-full max-w-[430px] flex-col overflow-hidden bg-background sm:min-h-[860px] sm:rounded-[36px] sm:border sm:border-border sm:shadow-[0_20px_50px_rgba(61,49,49,0.08)]">
        <main className={cn("flex flex-1 flex-col px-5 pt-6 pb-32", contentClassName)}>
          {children}
        </main>
        {withBottomNav ? <BottomNav /> : null}
      </div>
    </div>
  );
};
