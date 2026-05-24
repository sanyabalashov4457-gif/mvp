export type ItemStatus = "AVAILABLE" | "RESERVED" | "SOLD";

export type ReservationStatus =
  | "NEW"
  | "CONTACTED"
  | "CANCELLED"
  | "COMPLETED";

export type Store = {
  id: string;
  slug: string;
  name: string;
  city: string;
  area: string | null;
  description: string | null;
  story: string | null;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Item = {
  id: string;
  slug: string;
  title: string;
  brand: string;
  category: string;
  size: string;
  condition: string;
  price: number;
  currency: string;
  imageUrl: string;
  imageAlt: string | null;
  description: string;
  material: string | null;
  color: string | null;
  era: string | null;
  fit: string | null;
  measurements: string | null;
  curatorNote: string | null;
  status: ItemStatus;
  isFeatured: boolean;
  storeId: string;
  createdAt: string;
  updatedAt: string;
};

export type ItemWithStore = Item & {
  store: Store;
};

export type Reservation = {
  id: string;
  itemId: string;
  customerName: string | null;
  contact: string | null;
  message: string | null;
  status: ReservationStatus;
  createdAt: string;
  updatedAt: string;
};
