"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { SlidersHorizontal, Sparkles } from "lucide-react";

import { ActionButtons } from "@/components/ActionButtons";
import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { Header } from "@/components/Header";
import {
  SwipeCard,
  type SwipeDirection,
  type SwipeSignal,
} from "@/components/SwipeCard";
import { useFavorites } from "@/hooks/useFavorites";
import type { ItemWithStore } from "@/types/item";

type DiscoverDiagnostics = {
  totalItemsInDb: number;
  availableItems: number;
  loadError: string | null;
};

type ItemsApiEnvelope = {
  success?: boolean;
  data?: unknown;
  error?: string | null;
};

type DiscoverClientProps = {
  items: ItemWithStore[];
  diagnostics: DiscoverDiagnostics;
};

const extractItemsFromPayload = (payload: unknown): ItemWithStore[] => {
  if (Array.isArray(payload)) {
    return payload as ItemWithStore[];
  }

  if (payload && typeof payload === "object") {
    const envelope = payload as ItemsApiEnvelope;
    if (Array.isArray(envelope.data)) {
      return envelope.data as ItemWithStore[];
    }
  }

  return [];
};

export const DiscoverClient = ({ items, diagnostics }: DiscoverClientProps) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [swipeSignal, setSwipeSignal] = useState<SwipeSignal | null>(null);
  const [savedToastVisible, setSavedToastVisible] = useState(false);
  const [fallbackItems, setFallbackItems] = useState<ItemWithStore[] | null>(null);
  const [fallbackSource, setFallbackSource] = useState<
    "server" | "api-available" | "api-all"
  >("server");
  const [fallbackError, setFallbackError] = useState<string | null>(null);

  const { addFavorite } = useFavorites();
  const router = useRouter();

  const discoverItems = fallbackItems ?? items;

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") {
      return;
    }

    console.info("[Discover] Items diagnostics", {
      serverItems: items.length,
      totalItemsInDb: diagnostics.totalItemsInDb,
      availableItemsInDb: diagnostics.availableItems,
      loadError: diagnostics.loadError,
      fallbackItems: fallbackItems?.length ?? 0,
      fallbackSource,
    });
  }, [
    diagnostics.availableItems,
    diagnostics.loadError,
    diagnostics.totalItemsInDb,
    fallbackItems,
    fallbackSource,
    items.length,
  ]);

  useEffect(() => {
    if (items.length > 0 || diagnostics.loadError) {
      return;
    }

    let cancelled = false;

    const loadItemsFromApi = async () => {
      try {
        const availableResponse = await fetch("/api/items", {
          cache: "no-store",
        });
        const availablePayload = (await availableResponse.json()) as ItemsApiEnvelope;
        const availableItems = extractItemsFromPayload(availablePayload);

        if (!cancelled && availableItems.length > 0) {
          setFallbackItems(availableItems);
          setFallbackSource("api-available");
          return;
        }

        const allResponse = await fetch("/api/items?status=ALL", {
          cache: "no-store",
        });
        const allPayload = (await allResponse.json()) as ItemsApiEnvelope;
        const allItems = extractItemsFromPayload(allPayload);

        if (!cancelled && allItems.length > 0) {
          setFallbackItems(allItems);
          setFallbackSource("api-all");
          return;
        }

        if (!cancelled) {
          setFallbackError("No items were returned by /api/items.");
        }
      } catch (error) {
        if (!cancelled) {
          setFallbackError(
            error instanceof Error
              ? error.message
              : "Failed to load items from /api/items.",
          );
        }
      }
    };

    void loadItemsFromApi();

    return () => {
      cancelled = true;
    };
  }, [diagnostics.loadError, items.length]);

  const currentItem = useMemo(
    () => discoverItems[activeIndex],
    [activeIndex, discoverItems],
  );
  const nextItem = useMemo(
    () => discoverItems[activeIndex + 1],
    [activeIndex, discoverItems],
  );

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
        addFavorite(currentItem.slug);
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

    router.push(`/item/${currentItem.slug}`);
  };

  const emptyDescription = diagnostics.loadError
    ? `${diagnostics.loadError} Check DATABASE_URL and Prisma connection.`
    : fallbackError
      ? `${fallbackError} Expected format: { success: true, data: items }.`
      : diagnostics.totalItemsInDb > 0 && diagnostics.availableItems === 0
        ? "All items in DB are currently not AVAILABLE. Update item status or reseed data."
        : "New finds drop soon. Saved pieces are waiting in your archive.";

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
            className="rounded-full border border-border bg-card p-2 text-muted transition-colors hover:bg-accent/20 hover:text-primary"
            aria-label="Filters"
          >
            <SlidersHorizontal className="h-[1.05rem] w-[1.05rem]" />
          </button>
        }
      />

      <p className="mb-1 text-sm text-muted">
        Every piece had a first life. Find its second.
      </p>

      <p className="mb-4 text-xs uppercase tracking-[0.12em] text-muted/80">
        Swipe through curated second-hand finds.
      </p>

      {process.env.NODE_ENV === "development" ? (
        <p className="mb-3 text-xs uppercase tracking-[0.12em] text-muted/80">
          Debug: {discoverItems.length} items · source: {fallbackSource}
        </p>
      ) : null}

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
                <span className="absolute bottom-4 left-4 rounded-full border border-background/60 bg-background/82 px-3 py-1 text-[0.62rem] font-medium uppercase tracking-[0.12em] text-primary">
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
          description={emptyDescription}
          action={
            <Link
              href="/favorites"
              className="inline-flex items-center rounded-full border border-border bg-card px-5 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-accent/20"
            >
              View saved pieces
            </Link>
          }
        />
      )}
    </AppShell>
  );
};
