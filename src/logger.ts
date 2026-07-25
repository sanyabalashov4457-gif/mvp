import fs from "fs";
import path from "path";

const LOG_DIR = path.join(process.cwd(), "logs");
const LOG_FILE = path.join(LOG_DIR, "bot.log");

function ensureLogDir(): void {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}

function timestamp(): string {
  return new Date().toISOString();
}

function write(level: string, message: string): void {
  const line = `[${timestamp()}] [${level}] ${message}`;
  // eslint-disable-next-line no-console
  console.log(line);
  try {
    ensureLogDir();
    fs.appendFileSync(LOG_FILE, line + "\n");
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(`[${timestamp()}] [ERROR] Failed to write log file: ${String(err)}`);
  }
}

export const logger = {
  info: (message: string): void => write("INFO", message),
  warn: (message: string): void => write("WARN", message),
  error: (message: string): void => write("ERROR", message),
};
