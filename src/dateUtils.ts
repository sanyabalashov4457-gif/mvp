function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}

export function toISODate(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

export function toDisplayDate(date: Date): string {
  return `${pad2(date.getDate())}.${pad2(date.getMonth() + 1)}.${date.getFullYear()}`;
}

export function today(): Date {
  return new Date();
}

export function yesterday(): Date {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d;
}

const CUSTOM_DATE_RE = /^(\d{2})\.(\d{2})\.(\d{4})$/;

export function parseDisplayDate(text: string): Date | undefined {
  const match = CUSTOM_DATE_RE.exec(text.trim());
  if (!match) {
    return undefined;
  }
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);

  const date = new Date(year, month - 1, day);
  const isValid =
    date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;

  return isValid ? date : undefined;
}
