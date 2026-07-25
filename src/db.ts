import { Pool } from "pg";
import { config, Currency } from "./config";
import { Category } from "./categories";
import { logger } from "./logger";
import { enqueue, loadQueue, removeFromQueue, incrementAttempts } from "./queue";

export interface ExpenseRow {
  item: string;
  amount: number;
  currency: Currency;
  category: Category;
  expense_date: string; // YYYY-MM-DD
}

const QUERY_TIMEOUT_MS = 8000;
const MAX_ATTEMPTS = 20;

const pool = new Pool({
  connectionString: config.databaseUrl,
  query_timeout: QUERY_TIMEOUT_MS,
  connectionTimeoutMillis: QUERY_TIMEOUT_MS,
});

pool.on("error", (err) => {
  logger.error(`Unexpected Postgres pool error: ${String(err)}`);
});

export async function insertExpense(row: ExpenseRow): Promise<boolean> {
  try {
    await pool.query(
      `INSERT INTO expenses (item, amount, currency, category, expense_date)
       VALUES ($1, $2, $3, $4, $5)`,
      [row.item, row.amount, row.currency, row.category, row.expense_date],
    );
    return true;
  } catch (err) {
    logger.error(`Postgres insert failed: ${String(err)}`);
    return false;
  }
}

export type SubmitOutcome = "sent" | "queued";

export async function submitExpense(row: ExpenseRow): Promise<SubmitOutcome> {
  const success = await insertExpense(row);
  if (success) {
    return "sent";
  }
  enqueue(row);
  return "queued";
}

export async function retryPendingQueue(): Promise<void> {
  const entries = loadQueue();
  if (entries.length === 0) {
    return;
  }

  logger.info(`Retrying ${entries.length} pending expense(s) from local queue`);

  for (const entry of entries) {
    const success = await insertExpense({
      item: entry.item,
      amount: entry.amount,
      currency: entry.currency,
      category: entry.category,
      expense_date: entry.expense_date,
    });

    if (success) {
      removeFromQueue(entry.localId);
      logger.info(`Synced queued expense ${entry.localId} to Postgres`);
    } else {
      incrementAttempts(entry.localId);
      const attempts = entry.attempts + 1;
      if (attempts >= MAX_ATTEMPTS) {
        logger.warn(
          `Expense ${entry.localId} still not synced after ${attempts} attempts, keeping in queue`,
        );
      }
    }
  }
}
