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
  const [fallbackError, setFallbackError] = useState<string | null>(null);

  const { addFavorite } = useFavorites();
  const router = useRouter();

  const discoverItems = fallbackItems ?? items;

  const currentItem = useMemo(
    () => discoverItems[activeIndex],
    [activeIndex, discoverItems],
  );
  const nextItem = useMemo(
    () => discoverItems[activeIndex + 1],
    [activeIndex, discoverItems],
  );

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") {
      return;
    }

    console.log("DiscoverClient items", discoverItems);
    console.log("currentIndex", activeIndex);
    console.log("currentItem", currentItem);
  }, [activeIndex, currentItem, discoverItems]);

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
          return;
        }

        const allResponse = await fetch("/api/items?status=ALL", {
          cache: "no-store",
        });
        const allPayload = (await allResponse.json()) as ItemsApiEnvelope;
        const allItems = extractItemsFromPayload(allPayload);

        if (!cancelled && allItems.length > 0) {
          setFallbackItems(allItems);
          return;
        }

        if (!cancelled) {
          setFallbackError("Не удалось получить товары из /api/items.");
        }
      } catch (error) {
        if (!cancelled) {
          setFallbackError(
            error instanceof Error
              ? error.message
              : "Не удалось загрузить товары из API.",
          );
        }
      }
    };

    void loadItemsFromApi();

    return () => {
      cancelled = true;
    };
  }, [diagnostics.loadError, items.length]);

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
    ? `${diagnostics.loadError} Проверь подключение DATABASE_URL и Prisma.`
    : fallbackError
      ? fallbackError
      : diagnostics.totalItemsInDb > 0 && diagnostics.availableItems === 0
        ? "В базе есть товары, но у них нет статуса AVAILABLE. Проверь статус в БД."
        : "Скоро появятся новые находки. Сохраненные вещи уже ждут тебя в архиве.";

  return (
    <AppShell contentClassName="pb-36">
      <AnimatePresence>
        {savedToastVisible ? (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="pointer-events-none fixed left-1/2 top-5 z-50 -translate-x-1/2 rounded-full border border-border bg-background/95 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-primary shadow-sm backdrop-blur"
          >
            Сохранено
          </motion.div>
        ) : null}
      </AnimatePresence>

      <Header
        title="SecondPlace"
        subtitle="Винтажные находки из секонд-хендов"
        rightSlot={
          <button
            type="button"
            className="rounded-full border border-border bg-card p-2 text-muted transition-colors hover:bg-accent/20 hover:text-primary"
            aria-label="Фильтры"
          >
            <SlidersHorizontal className="h-[1.05rem] w-[1.05rem]" />
          </button>
        }
      />

      <p className="mb-4 text-sm leading-relaxed text-muted">
        Каждая вещь уже прожила первую жизнь. Найди для нее вторую.
      </p>

      {currentItem ? (
        <div className="flex min-h-0 flex-1 flex-col">
          <section
            className="relative w-full flex-1"
            style={{ minHeight: 420, maxHeight: 620 }}
          >
            <div className="relative h-full w-full">
              {nextItem ? (
                <motion.div
                  aria-hidden
                  initial={{ scale: 0.92, opacity: 0 }}
                  animate={{ scale: 0.96, opacity: 0.6 }}
                  transition={{ type: "spring", stiffness: 220, damping: 24 }}
                  className="absolute inset-2 z-10 overflow-hidden rounded-[30px] border border-border bg-card"
                >
                  <Image
                    src={nextItem.imageUrl}
                    alt=""
                    fill
                    sizes="(max-width: 430px) 100vw, 430px"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-primary/22" />
                  <span className="absolute bottom-4 left-4 rounded-full border border-background/60 bg-background/82 px-3 py-1 text-[0.62rem] font-medium uppercase tracking-[0.12em] text-primary">
                    Единственный экземпляр
                  </span>
                </motion.div>
              ) : null}

              <div className="absolute inset-0 z-20">
                <SwipeCard
                  item={currentItem}
                  onSwipe={handleSwipe}
                  swipeSignal={swipeSignal}
                />
              </div>
            </div>
          </section>

          <ActionButtons
            onSkip={() => requestSwipe("left")}
            onSave={() => requestSwipe("right")}
            onDetails={openCurrentItem}
          />
        </div>
      ) : (
        <EmptyState
          icon={<Sparkles className="h-9 w-9" />}
          title="Пока это все"
          description={emptyDescription}
          action={
            <Link
              href="/favorites"
              className="inline-flex items-center rounded-full border border-border bg-card px-5 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-accent/20"
            >
              Открыть сохраненные
            </Link>
          }
        />
      )}
    </AppShell>
  );
};
