import dotenv from "dotenv";

dotenv.config();

export type Currency = "RUB" | "USD";

interface Config {
  botToken: string;
  allowedUserId: number;
  databaseUrl: string;
  defaultCurrency: Currency;
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === "") {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function loadConfig(): Config {
  const botToken = requireEnv("BOT_TOKEN");
  const allowedUserIdRaw = requireEnv("ALLOWED_USER_ID");
  const allowedUserId = Number(allowedUserIdRaw);
  if (!Number.isInteger(allowedUserId)) {
    throw new Error("ALLOWED_USER_ID must be an integer");
  }

  const databaseUrl = requireEnv("DATABASE_URL");

  const defaultCurrencyRaw = (process.env.DEFAULT_CURRENCY ?? "RUB").toUpperCase();
  const defaultCurrency: Currency = defaultCurrencyRaw === "USD" ? "USD" : "RUB";

  return {
    botToken,
    allowedUserId,
    databaseUrl,
    defaultCurrency,
  };
}

export const config = loadConfig();
