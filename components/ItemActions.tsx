"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import { useFavorites } from "@/hooks/useFavorites";

type ItemActionsProps = {
  itemId: string;
};

export const ItemActions = ({ itemId }: ItemActionsProps) => {
  const { addFavorite, isFavorite } = useFavorites();
  const [reservationMessageVisible, setReservationMessageVisible] = useState(false);

  const reserveItem = () => {
    setReservationMessageVisible(true);
    window.setTimeout(() => {
      setReservationMessageVisible(false);
    }, 2600);
  };

  const saveItem = () => {
    addFavorite(itemId);
  };

  const itemSaved = isFavorite(itemId);

  return (
    <div className="mt-8 space-y-3 pb-2">
      <button
        type="button"
        onClick={reserveItem}
        className="w-full rounded-2xl bg-primary px-5 py-4 text-sm font-semibold tracking-[0.08em] text-background transition-transform active:scale-[0.98]"
      >
        Reserve item
      </button>
      <button
        type="button"
        onClick={saveItem}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-card px-5 py-4 text-sm font-semibold text-primary transition-transform active:scale-[0.98]"
      >
        <Heart className={`h-4 w-4 ${itemSaved ? "fill-primary" : ""}`} />
        {itemSaved ? "Saved" : "Save to favorites"}
      </button>

      <AnimatePresence>
        {reservationMessageVisible ? (
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="rounded-2xl border border-border bg-card px-4 py-3 text-center text-sm text-muted"
          >
            Reservation flow will be added soon.
          </motion.p>
        ) : null}
      </AnimatePresence>
    </div>
  );
};
