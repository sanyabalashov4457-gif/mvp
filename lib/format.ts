export const formatPrice = (price: number, currency: string) => {
  const formatted = new Intl.NumberFormat("ru-RU").format(price);
  return `${formatted} ${currency}`;
};
