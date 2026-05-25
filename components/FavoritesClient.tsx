"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Heart } from "lucide-react";

import { EmptyState } from "@/components/EmptyState";
import { ItemCard } from "@/components/ItemCard";
import { useFavorites } from "@/hooks/useFavorites";
import type { ItemWithStore } from "@/types/item";

type ItemsApiResponse = {
  success?: boolean;
  data?: unknown;
  error?: string | null;
};

const extractItemsFromPayload = (payload: unknown): ItemWithStore[] => {
  if (Array.isArray(payload)) {
    return payload as ItemWithStore[];
  }

  if (payload && typeof payload === "object") {
    const envelope = payload as ItemsApiResponse;
    if (Array.isArray(envelope.data)) {
      return envelope.data as ItemWithStore[];
    }
  }

  return [];
};

const FavoritesLoading = () => (
  <section className="grid grid-cols-2 gap-3" aria-label="Loading saved items">
    {Array.from({ length: 4 }).map((_, index) => (
      <div
        key={index}
        className="overflow-hidden rounded-3xl border border-border bg-card"
      >
        <div className="aspect-[3/4] animate-pulse bg-primary/8" />
        <div className="space-y-2 p-3.5">
          <div className="h-2.5 w-16 animate-pulse rounded-full bg-primary/10" />
          <div className="h-3.5 w-24 animate-pulse rounded-full bg-primary/10" />
          <div className="h-3.5 w-20 animate-pulse rounded-full bg-primary/10" />
        </div>
      </div>
    ))}
  </section>
);

export const FavoritesClient = () => {
  const { favoriteSlugs, hydrated, removeFavorite } = useFavorites();
  const [items, setItems] = useState<ItemWithStore[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!hydrated || favoriteSlugs.length === 0) {
      return;
    }

    let cancelled = false;

    const loadFavoriteItems = async () => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const query = encodeURIComponent(favoriteSlugs.join(","));
        const response = await fetch(`/api/items?status=ALL&slugs=${query}`, {
          method: "GET",
          cache: "no-store",
        });

        const payload = (await response.json()) as ItemsApiResponse;
        const resolvedItems = extractItemsFromPayload(payload);

        if (!response.ok) {
          throw new Error(payload.error ?? "Failed to load saved pieces.");
        }

        const itemsBySlug = new Map(resolvedItems.map((item) => [item.slug, item]));
        const orderedItems = favoriteSlugs
          .map((slug) => itemsBySlug.get(slug))
          .filter((item): item is ItemWithStore => Boolean(item));

        if (!cancelled) {
          setItems(orderedItems);
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(
            error instanceof Error ? error.message : "Failed to load saved pieces.",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadFavoriteItems();

    return () => {
      cancelled = true;
    };
  }, [favoriteSlugs, hydrated]);

  const hasFavorites = favoriteSlugs.length > 0;

  if (!hydrated) {
    return <FavoritesLoading />;
  }

  if (!hasFavorites) {
    return (
      <EmptyState
        icon={<Heart className="h-9 w-9" />}
        title="No saved pieces yet"
        description="Swipe right on items you love."
      />
    );
  }

  if (isLoading) {
    return <FavoritesLoading />;
  }

  if (errorMessage) {
    return (
      <EmptyState
        title="Could not load saved finds"
        description={errorMessage}
      />
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<Heart className="h-9 w-9" />}
        title="No saved pieces yet"
        description="Swipe right on items you love."
      />
    );
  }

  return (
    <motion.section
      layout
      className="grid grid-cols-2 gap-3"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <AnimatePresence>
        {items.map((item) => (
          <ItemCard key={item.id} item={item} onRemove={removeFavorite} />
        ))}
      </AnimatePresence>
    </motion.section>
  );
};
