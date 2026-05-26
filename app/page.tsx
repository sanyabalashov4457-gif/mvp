import { ItemStatus } from "@prisma/client";

import { DiscoverClient } from "@/components/DiscoverClient";
import { mapItemsWithStore } from "@/lib/mappers";
import { prisma } from "@/lib/prisma";
import type { ItemWithStore } from "@/types/item";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let items: ItemWithStore[] = [];
  let totalItemsInDb = 0;
  let loadError: string | null = null;

  try {
    const [availableItems, totalItems] = await Promise.all([
      prisma.item.findMany({
        where: {
          status: ItemStatus.AVAILABLE,
        },
        include: {
          store: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.item.count(),
    ]);

    items = mapItemsWithStore(availableItems);
    totalItemsInDb = totalItems;

    if (totalItems > 0 && availableItems.length === 0) {
      console.warn(
        "В базе есть товары, но нет вещей со статусом AVAILABLE для Discover.",
      );
    }
  } catch (error) {
    console.error("Не удалось загрузить товары для Discover", error);
    loadError = "Не удалось загрузить товары из базы данных.";
  }

  return (
    <DiscoverClient
      items={items}
      diagnostics={{
        totalItemsInDb,
        availableItems: items.length,
        loadError,
      }}
    />
  );
}
