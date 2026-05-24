"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

const STORAGE_KEY = "secondplace:favorites";
const FAVORITES_EVENT = "secondplace:favorites-updated";

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
    // Ignore malformed localStorage payloads.
  }

  return [] as string[];
};

const readFavorites = () => {
  if (typeof window === "undefined") {
    return [] as string[];
  }

  return parseFavoriteIds(window.localStorage.getItem(STORAGE_KEY));
};

const subscribeToFavorites = (callback: () => void) => {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const onStorage = (event: StorageEvent) => {
    if (event.key !== null && event.key !== STORAGE_KEY) {
      return;
    }

    callback();
  };

  const onCustomEvent = () => callback();

  window.addEventListener("storage", onStorage);
  window.addEventListener(FAVORITES_EVENT, onCustomEvent);

  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(FAVORITES_EVENT, onCustomEvent);
  };
};

const notifyFavoritesChange = () => {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event(FAVORITES_EVENT));
};

const writeFavorites = (nextIds: string[]) => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextIds));
  notifyFavoritesChange();
};

const useHydratedFlag = () =>
  useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );

export const useFavorites = () => {
  const favoriteIds = useSyncExternalStore(
    subscribeToFavorites,
    readFavorites,
    () => [] as string[],
  );
  const hydrated = useHydratedFlag();

  const addFavorite = useCallback((itemId: string) => {
    const currentIds = readFavorites();
    if (currentIds.includes(itemId)) {
      return;
    }

    writeFavorites([itemId, ...currentIds]);
  }, []);

  const removeFavorite = useCallback((itemId: string) => {
    const currentIds = readFavorites();
    writeFavorites(currentIds.filter((id) => id !== itemId));
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
