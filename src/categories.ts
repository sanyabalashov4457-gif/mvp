export const CATEGORIES = [
  "Еда",
  "Комфорт",
  "Рестораны",
  "Быт",
  "Здоровье",
  "Подарки",
  "Подписки",
  "Спорт",
  "Учеба",
  "Одежда",
  "Путешествия",
] as const;

export type Category = (typeof CATEGORIES)[number];

export function findCategory(raw: string): Category | undefined {
  const normalized = raw.trim().toLowerCase();
  return CATEGORIES.find((c) => c.toLowerCase() === normalized);
}
