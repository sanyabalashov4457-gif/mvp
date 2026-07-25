import { Category, findCategory } from "./categories";

export interface QuickParseResult {
  item: string;
  amount: number;
  category?: Category;
}

const NUMBER_RE = /\d+(?:[.,]\d+)?/;

export function parseQuickEntry(text: string): QuickParseResult | undefined {
  const match = NUMBER_RE.exec(text);
  if (!match) {
    return undefined;
  }

  const item = text.slice(0, match.index).trim();
  if (item === "") {
    return undefined;
  }

  const amount = Number(match[0].replace(",", "."));
  if (!Number.isFinite(amount) || amount <= 0) {
    return undefined;
  }

  const rest = text.slice(match.index + match[0].length).trim();
  const category = rest === "" ? undefined : findCategory(rest);

  return { item, amount, category };
}
