import { Telegraf, Scenes, session, Markup } from "telegraf";
import { config } from "./config";
import { logger } from "./logger";
import { CATEGORIES, Category } from "./categories";
import { parseQuickEntry } from "./parser";
import { submitExpense, retryPendingQueue } from "./db";
import { loadQueue } from "./queue";
import { toISODate, today } from "./dateUtils";
import { addExpenseWizard, ADD_EXPENSE_WIZARD_ID } from "./scenes/addExpense";

type BotContext = Scenes.WizardContext;

const bot = new Telegraf<BotContext>(config.botToken);

const stage = new Scenes.Stage<BotContext>([addExpenseWizard]);

// In-memory state for a pending quick-entry that is waiting on a category
// selection. Safe as a single module-level variable because this bot is
// used by exactly one Telegram user.
let pendingQuickEntry: { item: string; amount: number } | undefined;

bot.use(async (ctx, next) => {
  if (ctx.from?.id !== config.allowedUserId) {
    await ctx.reply("Этот бот приватный");
    return;
  }
  return next();
});

bot.use(session());
bot.use(stage.middleware());

function quickCategoryKeyboard() {
  const buttons = CATEGORIES.map((c) => Markup.button.callback(c, `qcat:${c}`));
  const rows = [];
  for (let i = 0; i < buttons.length; i += 2) {
    rows.push(buttons.slice(i, i + 2));
  }
  return Markup.inlineKeyboard(rows);
}

async function finalizeQuickEntry(
  ctx: BotContext,
  item: string,
  amount: number,
  category: Category,
): Promise<void> {
  const outcome = await submitExpense({
    item,
    amount,
    currency: config.defaultCurrency,
    category,
    expense_date: toISODate(today()),
  });

  if (outcome === "sent") {
    await ctx.reply("Записано ✅");
  } else {
    await ctx.reply("База недоступна, сохранил локально, отправлю позже ⏳");
  }
}

bot.start(async (ctx) => {
  await ctx.reply(
    "Привет! Это твой личный бот учёта расходов.\n\n" +
      "Быстрый ввод: просто напиши, например «Кофе 250» или «Кофе 250 еда».\n" +
      "Пошаговый ввод: /add\n" +
      "Список команд: /help",
  );
});

bot.help(async (ctx) => {
  await ctx.reply(
    "Команды:\n" +
      "/add — пошаговый ввод расхода\n" +
      "/pending — записи, ещё не отправленные в базу\n" +
      "/cancel — отменить текущий диалог\n" +
      "/help — эта справка\n\n" +
      "Быстрый ввод одной строкой:\n" +
      '"Товар Сумма [Категория]", например:\n' +
      "Кофе 250\n" +
      "Кофе 250 еда\n\n" +
      "Если категория не указана или не распознана — бот попросит выбрать её кнопками.\n" +
      "Валюта по умолчанию для быстрого ввода: " +
      config.defaultCurrency,
  );
});

bot.command("add", async (ctx) => {
  await ctx.scene.enter(ADD_EXPENSE_WIZARD_ID);
});

bot.command("cancel", async (ctx) => {
  if (ctx.scene.current) {
    await ctx.scene.leave();
    await ctx.reply("Диалог отменён.");
  } else {
    pendingQuickEntry = undefined;
    await ctx.reply("Нечего отменять.");
  }
});

bot.command("pending", async (ctx) => {
  const entries = loadQueue();
  if (entries.length === 0) {
    await ctx.reply("Очередь пуста, все записи отправлены.");
    return;
  }
  const lines = entries.map(
    (e, i) =>
      `${i + 1}. ${e.item} — ${e.amount} ${e.currency}, ${e.category}, ${e.expense_date} (попыток: ${e.attempts})`,
  );
  await ctx.reply(`В очереди ${entries.length} запись(ей):\n${lines.join("\n")}`);
});

bot.action(/^qcat:/, async (ctx) => {
  const data = ctx.callbackQuery && "data" in ctx.callbackQuery ? ctx.callbackQuery.data : undefined;
  if (!data) {
    await ctx.answerCbQuery();
    return;
  }
  const category = data.slice("qcat:".length) as Category;
  await ctx.answerCbQuery();

  if (!pendingQuickEntry) {
    await ctx.reply("Не нашёл черновик записи, начните заново.");
    return;
  }

  const { item, amount } = pendingQuickEntry;
  pendingQuickEntry = undefined;
  await finalizeQuickEntry(ctx, item, amount, category);
});

bot.on("text", async (ctx) => {
  const text = ctx.message.text;
  const parsed = parseQuickEntry(text);

  if (!parsed) {
    await ctx.reply("Не понял формат. Используйте /add для пошагового ввода.");
    return;
  }

  if (parsed.category) {
    await finalizeQuickEntry(ctx, parsed.item, parsed.amount, parsed.category);
    return;
  }

  pendingQuickEntry = { item: parsed.item, amount: parsed.amount };
  await ctx.reply("Категория:", quickCategoryKeyboard());
});

const RETRY_INTERVAL_MS = 2 * 60 * 1000;

setInterval(() => {
  retryPendingQueue().catch((err) => {
    logger.error(`Pending queue retry cycle failed: ${String(err)}`);
  });
}, RETRY_INTERVAL_MS);

// bot.launch() resolves only once the bot stops (its long-polling loop
// runs for the lifetime of the process), so log readiness via the
// onLaunch callback instead of awaiting the returned promise.
bot
  .launch({}, () => {
    logger.info("Bot started");
  })
  .catch((err) => {
    logger.error(`Bot stopped with error: ${String(err)}`);
    process.exit(1);
  });

bot.catch((err) => {
  logger.error(`Unhandled error while processing update: ${String(err)}`);
});

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
