"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

const STORAGE_KEY = "secondplace:favorites";
const FAVORITES_EVENT = "secondplace:favorites-updated";

const parseFavoriteSlugs = (value: string | null) => {
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

  return parseFavoriteSlugs(window.localStorage.getItem(STORAGE_KEY));
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

const writeFavorites = (nextSlugs: string[]) => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSlugs));
  notifyFavoritesChange();
};

const useHydratedFlag = () =>
  useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );

export const useFavorites = () => {
  const favoriteSlugs = useSyncExternalStore(
    subscribeToFavorites,
    readFavorites,
    () => [] as string[],
  );
  const hydrated = useHydratedFlag();

  const addFavorite = useCallback((itemSlug: string) => {
    const currentSlugs = readFavorites();
    if (currentSlugs.includes(itemSlug)) {
      return;
    }

    writeFavorites([itemSlug, ...currentSlugs]);
  }, []);

  const removeFavorite = useCallback((itemSlug: string) => {
    const currentSlugs = readFavorites();
    writeFavorites(currentSlugs.filter((slug) => slug !== itemSlug));
  }, []);

  const toggleFavorite = useCallback((itemSlug: string) => {
    const currentSlugs = readFavorites();
    if (currentSlugs.includes(itemSlug)) {
      writeFavorites(currentSlugs.filter((slug) => slug !== itemSlug));
      return;
    }

    writeFavorites([itemSlug, ...currentSlugs]);
  }, []);

  const isFavorite = useCallback(
    (itemSlug: string) => favoriteSlugs.includes(itemSlug),
    [favoriteSlugs],
  );

  return useMemo(
    () => ({
      favoriteSlugs,
      hydrated,
      addFavorite,
      removeFavorite,
      toggleFavorite,
      isFavorite,
    }),
    [
      favoriteSlugs,
      hydrated,
      addFavorite,
      removeFavorite,
      toggleFavorite,
      isFavorite,
    ],
  );
};
