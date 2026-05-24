"use client";

import Link from "next/link";
import Image from "next/image";
import { Heart } from "lucide-react";
import { motion } from "framer-motion";

import { formatPrice } from "@/lib/format";
import type { ItemWithStore } from "@/types/item";

type ItemCardProps = {
  item: ItemWithStore;
  onRemove: (itemSlug: string) => void;
};

export const ItemCard = ({ item, onRemove }: ItemCardProps) => {
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ type: "spring", stiffness: 220, damping: 24 }}
      className="group relative overflow-hidden rounded-3xl border border-border bg-card"
    >
      <Link href={`/item/${item.slug}`} className="block">
        <div className="relative aspect-[3/4] overflow-hidden">
          <Image
            src={item.imageUrl}
            alt={item.imageAlt ?? `${item.brand} ${item.title}`}
            fill
            sizes="(max-width: 430px) 50vw, 200px"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
        <div className="space-y-1 p-3.5">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.13em] text-muted">
            {item.brand}
          </p>
          <h3 className="line-clamp-2 text-sm font-medium leading-snug text-primary">
            {item.title}
          </h3>
          <p className="text-xs text-muted">
            Size {item.size} · {item.store.city}
          </p>
          <p className="pt-1 text-sm font-semibold text-primary">
            {formatPrice(item.price, item.currency)}
          </p>
        </div>
      </Link>

      <button
        type="button"
        aria-label="Remove from favorites"
        onClick={() => onRemove(item.slug)}
        className="absolute right-3 top-3 rounded-full border border-background/60 bg-background/88 p-2 text-primary shadow-sm backdrop-blur transition-colors hover:bg-background"
      >
        <Heart className="h-4 w-4 fill-primary text-primary" />
      </button>
    </motion.article>
  );
};
