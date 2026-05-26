"use client";

import type { ComponentType } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bookmark, Home, User } from "lucide-react";

import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
};

const navItems: NavItem[] = [
  { href: "/", label: "Поиск", icon: Home },
  { href: "/favorites", label: "Сохраненные", icon: Bookmark },
  { href: "/profile", label: "Профиль", icon: User },
];

export const BottomNav = () => {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-[430px] border-t border-border bg-background/92 px-4 pb-[calc(env(safe-area-inset-bottom)+0.8rem)] pt-3 backdrop-blur-xl">
      <ul className="grid grid-cols-3 gap-1">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center rounded-2xl py-2 text-xs font-medium transition-colors",
                  isActive
                    ? "bg-card text-primary shadow-[0_6px_20px_rgba(61,49,49,0.08)]"
                    : "text-muted hover:text-primary",
                )}
              >
                <Icon className="mb-1 h-[1.05rem] w-[1.05rem]" />
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};
