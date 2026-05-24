"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Heart } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { Header } from "@/components/Header";
import { ItemCard } from "@/components/ItemCard";
import { getItemsByIds } from "@/data/items";
import { useFavorites } from "@/hooks/useFavorites";

export default function FavoritesPage() {
  const { favoriteIds, hydrated, removeFavorite } = useFavorites();
  const favoriteItems = getItemsByIds(favoriteIds);

  return (
    <AppShell>
      <Header title="Saved finds" subtitle="Pieces you liked" />

      {!hydrated || favoriteItems.length === 0 ? (
        <EmptyState
          icon={<Heart className="h-9 w-9" />}
          title="No saved pieces yet"
          description="Swipe right on items you love."
        />
      ) : (
        <motion.section
          layout
          className="grid grid-cols-2 gap-3"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <AnimatePresence>
            {favoriteItems.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                onRemove={(itemId) => removeFavorite(itemId)}
              />
            ))}
          </AnimatePresence>
        </motion.section>
      )}
    </AppShell>
  );
}
