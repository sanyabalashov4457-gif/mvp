"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "secondplace:favorites";

const parseFavoriteIds = (value: string | null) => {
  if (!value) {
    return [] as string[];
  }

  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed.filter((entry): entry is string => typeof entry === "string");
    }
  } catch {
    // Ignore broken JSON to keep the app resilient.
  }

  return [] as string[];
};

export const useFavorites = () => {
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const storedIds = parseFavoriteIds(window.localStorage.getItem(STORAGE_KEY));
    setFavoriteIds(storedIds);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !hydrated) {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(favoriteIds));
  }, [favoriteIds, hydrated]);

  const addFavorite = useCallback((itemId: string) => {
    setFavoriteIds((current) =>
      current.includes(itemId) ? current : [itemId, ...current],
    );
  }, []);

  const removeFavorite = useCallback((itemId: string) => {
    setFavoriteIds((current) => current.filter((id) => id !== itemId));
  }, []);

  const isFavorite = useCallback(
    (itemId: string) => favoriteIds.includes(itemId),
    [favoriteIds],
  );

  return useMemo(
    () => ({
      favoriteIds,
      hydrated,
      addFavorite,
      removeFavorite,
      isFavorite,
    }),
    [favoriteIds, hydrated, addFavorite, removeFavorite, isFavorite],
  );
};
