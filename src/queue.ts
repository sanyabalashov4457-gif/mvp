import fs from "fs";
import path from "path";
import crypto from "crypto";
import { Currency } from "./config";
import { Category } from "./categories";
import { logger } from "./logger";

const DATA_DIR = path.join(process.cwd(), "data");
const QUEUE_FILE = path.join(DATA_DIR, "pending.json");

export interface PendingExpense {
  localId: string;
  item: string;
  amount: number;
  currency: Currency;
  category: Category;
  expense_date: string; // YYYY-MM-DD
  attempts: number;
  createdAt: string;
}

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readQueueFile(): PendingExpense[] {
  ensureDataDir();
  if (!fs.existsSync(QUEUE_FILE)) {
    return [];
  }
  try {
    const raw = fs.readFileSync(QUEUE_FILE, "utf-8");
    if (raw.trim() === "") {
      return [];
    }
    const parsed = JSON.parse(raw) as PendingExpense[];
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    logger.error(`Failed to read pending queue, treating as empty: ${String(err)}`);
    return [];
  }
}

function writeQueueFile(entries: PendingExpense[]): void {
  ensureDataDir();
  fs.writeFileSync(QUEUE_FILE, JSON.stringify(entries, null, 2), "utf-8");
}

export function loadQueue(): PendingExpense[] {
  return readQueueFile();
}

export function enqueue(entry: Omit<PendingExpense, "localId" | "attempts" | "createdAt">): PendingExpense {
  const entries = readQueueFile();
  const pending: PendingExpense = {
    ...entry,
    localId: crypto.randomUUID(),
    attempts: 0,
    createdAt: new Date().toISOString(),
  };
  entries.push(pending);
  writeQueueFile(entries);
  return pending;
}

export function removeFromQueue(localId: string): void {
  const entries = readQueueFile().filter((e) => e.localId !== localId);
  writeQueueFile(entries);
}

export function incrementAttempts(localId: string): void {
  const entries = readQueueFile();
  const entry = entries.find((e) => e.localId === localId);
  if (entry) {
    entry.attempts += 1;
    writeQueueFile(entries);
  }
}
