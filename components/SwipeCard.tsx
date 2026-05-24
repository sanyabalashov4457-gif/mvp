"use client";

import { useCallback, useEffect, useRef } from "react";
import Image from "next/image";
import {
  animate,
  motion,
  useMotionValue,
  useTransform,
  type PanInfo,
} from "framer-motion";

import { formatPrice } from "@/lib/format";
import type { ItemWithStore } from "@/types/item";

export type SwipeDirection = "left" | "right";

export type SwipeSignal = {
  direction: SwipeDirection;
  token: number;
};

type SwipeCardProps = {
  item: ItemWithStore;
  onSwipe: (direction: SwipeDirection) => void;
  swipeSignal?: SwipeSignal | null;
};

const SWIPE_THRESHOLD = 120;
const VELOCITY_THRESHOLD = 650;

export const SwipeCard = ({ item, onSwipe, swipeSignal }: SwipeCardProps) => {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-220, 0, 220], [-11, 0, 11]);
  const saveOpacity = useTransform(x, [30, SWIPE_THRESHOLD], [0, 1]);
  const skipOpacity = useTransform(x, [-30, -SWIPE_THRESHOLD], [0, 1]);
  const inFlight = useRef(false);
  const lastSignalToken = useRef<number | null>(null);

  const flyAway = useCallback(
    async (direction: SwipeDirection) => {
      if (inFlight.current) {
        return;
      }

      inFlight.current = true;

      const flyDistance =
        (typeof window !== "undefined" ? window.innerWidth : 390) + 320;

      await animate(x, direction === "right" ? flyDistance : -flyDistance, {
        type: "spring",
        stiffness: 220,
        damping: 28,
      });

      onSwipe(direction);
    },
    [onSwipe, x],
  );

  const returnToCenter = useCallback(
    (info: PanInfo) => {
      if (
        info.offset.x > SWIPE_THRESHOLD ||
        info.velocity.x > VELOCITY_THRESHOLD
      ) {
        void flyAway("right");
        return;
      }

      if (
        info.offset.x < -SWIPE_THRESHOLD ||
        info.velocity.x < -VELOCITY_THRESHOLD
      ) {
        void flyAway("left");
        return;
      }

      void animate(x, 0, {
        type: "spring",
        stiffness: 320,
        damping: 26,
      });
    },
    [flyAway, x],
  );

  useEffect(() => {
    if (!swipeSignal || lastSignalToken.current === swipeSignal.token) {
      return;
    }

    lastSignalToken.current = swipeSignal.token;
    void flyAway(swipeSignal.direction);
  }, [swipeSignal, flyAway]);

  useEffect(() => {
    x.set(0);
    inFlight.current = false;
  }, [item.id, x]);

  return (
    <motion.article
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.9}
      className="relative h-full w-full overflow-hidden rounded-[32px] border border-border bg-card shadow-[0_26px_52px_rgba(61,49,49,0.14)]"
      style={{ x, rotate }}
      initial={{ y: 30, opacity: 0, scale: 0.96 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 220, damping: 24 }}
      onDragEnd={(_, info) => returnToCenter(info)}
    >
      <Image
        src={item.imageUrl}
        alt={item.imageAlt ?? `${item.brand} ${item.title}`}
        fill
        sizes="(max-width: 430px) 100vw, 430px"
        className="object-cover"
        priority
      />

      <motion.div
        style={{ opacity: saveOpacity }}
        className="absolute left-4 top-4 rounded-full border border-primary/30 bg-background/85 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-primary"
      >
        Save
      </motion.div>

      <motion.div
        style={{ opacity: skipOpacity }}
        className="absolute right-4 top-4 rounded-full border border-primary/30 bg-background/85 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-primary"
      >
        Skip
      </motion.div>

      <div className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-primary/90 via-primary/45 to-transparent" />

      <div className="absolute inset-x-0 bottom-0 p-6 text-background">
        <span className="inline-flex items-center rounded-full border border-background/45 bg-background/15 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.15em]">
          Curated find
        </span>

        <p className="mt-4 text-[0.7rem] font-medium uppercase tracking-[0.16em] text-background/82">
          {item.brand}
        </p>
        <h2 className="mt-1 text-[1.8rem] font-semibold leading-tight tracking-tight">
          {item.title}
        </h2>
        <p className="mt-3 text-sm text-background/85">
          Size {item.size} · {item.condition} · {item.store.city}
        </p>
        <p className="mt-1 text-xs uppercase tracking-[0.12em] text-background/78">
          {item.store.name}
        </p>
        <p className="mt-3 text-[1.8rem] font-semibold tracking-tight">
          {formatPrice(item.price, item.currency)}
        </p>
      </div>
    </motion.article>
  );
};
