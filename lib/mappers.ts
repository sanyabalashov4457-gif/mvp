import type { Prisma, Reservation } from "@prisma/client";

import type { ItemWithStore } from "@/types/item";

export type PrismaItemWithStore = Prisma.ItemGetPayload<{
  include: { store: true };
}>;

export const mapItemWithStore = (item: PrismaItemWithStore): ItemWithStore => ({
  id: item.id,
  slug: item.slug,
  title: item.title,
  brand: item.brand,
  category: item.category,
  size: item.size,
  condition: item.condition,
  price: item.price,
  currency: item.currency,
  imageUrl: item.imageUrl,
  imageAlt: item.imageAlt,
  description: item.description,
  material: item.material,
  color: item.color,
  era: item.era,
  fit: item.fit,
  measurements: item.measurements,
  curatorNote: item.curatorNote,
  status: item.status,
  isFeatured: item.isFeatured,
  storeId: item.storeId,
  createdAt: item.createdAt.toISOString(),
  updatedAt: item.updatedAt.toISOString(),
  store: {
    id: item.store.id,
    slug: item.store.slug,
    name: item.store.name,
    city: item.store.city,
    area: item.store.area,
    description: item.store.description,
    story: item.store.story,
    imageUrl: item.store.imageUrl,
    createdAt: item.store.createdAt.toISOString(),
    updatedAt: item.store.updatedAt.toISOString(),
  },
});

export const mapItemsWithStore = (items: PrismaItemWithStore[]) =>
  items.map(mapItemWithStore);

export const mapReservation = (reservation: Reservation) => ({
  id: reservation.id,
  itemId: reservation.itemId,
  customerName: reservation.customerName,
  contact: reservation.contact,
  message: reservation.message,
  status: reservation.status,
  createdAt: reservation.createdAt.toISOString(),
  updatedAt: reservation.updatedAt.toISOString(),
});
