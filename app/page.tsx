"use client";

import { useCallback, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { SlidersHorizontal, Sparkles } from "lucide-react";

import { ActionButtons } from "@/components/ActionButtons";
import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { Header } from "@/components/Header";
import { SwipeCard, type SwipeDirection, type SwipeSignal } from "@/components/SwipeCard";
import { items } from "@/data/items";
import { useFavorites } from "@/hooks/useFavorites";

export default function HomePage() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [swipeSignal, setSwipeSignal] = useState<SwipeSignal | null>(null);
  const [savedToastVisible, setSavedToastVisible] = useState(false);
  const { addFavorite } = useFavorites();
  const router = useRouter();

  const currentItem = useMemo(() => items[activeIndex], [activeIndex]);
  const nextItem = useMemo(() => items[activeIndex + 1], [activeIndex]);

  const showSavedToast = () => {
    setSavedToastVisible(true);
    window.setTimeout(() => {
      setSavedToastVisible(false);
    }, 1300);
  };

  const handleSwipe = useCallback(
    (direction: SwipeDirection) => {
      if (!currentItem) {
        return;
      }

      if (direction === "right") {
        addFavorite(currentItem.id);
        showSavedToast();
      }

      setActiveIndex((value) => value + 1);
      setSwipeSignal(null);
    },
    [addFavorite, currentItem],
  );

  const requestSwipe = (direction: SwipeDirection) => {
    if (!currentItem) {
      return;
    }

    setSwipeSignal({ direction, token: Date.now() });
  };

  const openCurrentItem = () => {
    if (!currentItem) {
      return;
    }

    router.push(`/item/${currentItem.id}`);
  };

  return (
    <AppShell>
      <AnimatePresence>
        {savedToastVisible ? (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="pointer-events-none fixed left-1/2 top-5 z-50 -translate-x-1/2 rounded-full border border-border bg-background/95 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-primary shadow-sm backdrop-blur"
          >
            Saved
          </motion.div>
        ) : null}
      </AnimatePresence>

      <Header
        title="SecondPlace"
        subtitle="Curated second-hand finds"
        rightSlot={
          <button
            type="button"
            className="rounded-full border border-border bg-card p-2 text-muted"
            aria-label="Filters"
          >
            <SlidersHorizontal className="h-[1.05rem] w-[1.05rem]" />
          </button>
        }
      />

      <p className="mb-4 text-sm text-muted">
        Swipe through curated second-hand finds.
      </p>

      {currentItem ? (
        <>
          <section className="relative h-[62vh] min-h-[480px] max-h-[640px]">
            {nextItem ? (
              <motion.div
                aria-hidden
                initial={{ scale: 0.92, opacity: 0 }}
                animate={{ scale: 0.96, opacity: 0.6 }}
                transition={{ type: "spring", stiffness: 220, damping: 24 }}
                className="absolute inset-3 overflow-hidden rounded-[30px] border border-border bg-card"
              >
                <Image
                  src={nextItem.imageUrl}
                  alt=""
                  fill
                  sizes="(max-width: 430px) 100vw, 430px"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-primary/25" />
                <span className="absolute bottom-4 left-4 rounded-full border border-background/60 bg-background/80 px-3 py-1 text-[0.62rem] font-medium uppercase tracking-[0.12em] text-primary">
                  One of one
                </span>
              </motion.div>
            ) : null}

            <SwipeCard
              item={currentItem}
              onSwipe={handleSwipe}
              swipeSignal={swipeSignal}
            />
          </section>

          <ActionButtons
            onSkip={() => requestSwipe("left")}
            onSave={() => requestSwipe("right")}
            onDetails={openCurrentItem}
          />
        </>
      ) : (
        <EmptyState
          icon={<Sparkles className="h-9 w-9" />}
          title="That’s all for now"
          description="New finds drop soon."
          action={
            <Link
              href="/favorites"
              className="inline-flex items-center rounded-full border border-border bg-card px-5 py-2.5 text-sm font-medium text-primary"
            >
              View saved pieces
            </Link>
          }
        />
      )}
    </AppShell>
  );
}
