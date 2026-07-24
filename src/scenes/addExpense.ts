import { Scenes, Markup } from "telegraf";
import { CATEGORIES, Category } from "../categories";
import { Currency } from "../config";
import { submitExpense } from "../db";
import { toISODate, toDisplayDate, today, yesterday, parseDisplayDate } from "../dateUtils";

export const ADD_EXPENSE_WIZARD_ID = "ADD_EXPENSE_WIZARD";

export type AddExpenseContext = Scenes.WizardContext;

interface AddExpenseState {
  item?: string;
  amount?: number;
  category?: Category;
  currency?: Currency;
  expenseDateISO?: string;
  expenseDateDisplay?: string;
  awaitingCustomDate?: boolean;
}

function getState(ctx: AddExpenseContext): AddExpenseState {
  return ctx.wizard.state as AddExpenseState;
}

function categoryKeyboard() {
  const buttons = CATEGORIES.map((c) => Markup.button.callback(c, `add_cat:${c}`));
  const rows = [];
  for (let i = 0; i < buttons.length; i += 2) {
    rows.push(buttons.slice(i, i + 2));
  }
  return Markup.inlineKeyboard(rows);
}

function currencyKeyboard() {
  return Markup.inlineKeyboard([
    [Markup.button.callback("RUB", "add_cur:RUB"), Markup.button.callback("USD", "add_cur:USD")],
  ]);
}

function dateKeyboard() {
  return Markup.inlineKeyboard([
    [Markup.button.callback("Сегодня", "add_date:today")],
    [Markup.button.callback("Вчера", "add_date:yesterday")],
    [Markup.button.callback("Ввести дату", "add_date:custom")],
  ]);
}

function confirmKeyboard() {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback("Отправить", "add_confirm:yes"),
      Markup.button.callback("Отмена", "add_confirm:no"),
    ],
  ]);
}

async function showSummary(ctx: AddExpenseContext): Promise<void> {
  const state = getState(ctx);
  await ctx.reply(
    `${state.item}, ${state.amount} ${state.currency}, ${state.category}, ${state.expenseDateDisplay}`,
    confirmKeyboard(),
  );
}

export const addExpenseWizard = new Scenes.WizardScene<AddExpenseContext>(
  ADD_EXPENSE_WIZARD_ID,
  async (ctx) => {
    await ctx.reply("Что купил?");
    return ctx.wizard.next();
  },
  async (ctx) => {
    if (!ctx.message || !("text" in ctx.message)) {
      await ctx.reply("Пожалуйста, введите текст.");
      return;
    }
    const state = getState(ctx);
    state.item = ctx.message.text.trim();
    await ctx.reply("Сколько?");
    return ctx.wizard.next();
  },
  async (ctx) => {
    if (!ctx.message || !("text" in ctx.message)) {
      await ctx.reply("Пожалуйста, введите число.");
      return;
    }
    const raw = ctx.message.text.trim().replace(",", ".");
    const amount = Number(raw);
    if (!Number.isFinite(amount) || amount <= 0) {
      await ctx.reply("Не понял сумму. Введите положительное число, например 250 или 250.50");
      return;
    }
    const state = getState(ctx);
    state.amount = amount;
    await ctx.reply("Категория:", categoryKeyboard());
    return ctx.wizard.next();
  },
  async (ctx) => {
    const cbQuery = ctx.callbackQuery;
    if (!cbQuery || !("data" in cbQuery) || !cbQuery.data.startsWith("add_cat:")) {
      await ctx.answerCbQuery("Выберите категорию кнопкой").catch(() => undefined);
      return;
    }
    const category = cbQuery.data.slice("add_cat:".length) as Category;
    await ctx.answerCbQuery();
    const state = getState(ctx);
    state.category = category;
    await ctx.reply("Валюта:", currencyKeyboard());
    return ctx.wizard.next();
  },
  async (ctx) => {
    const cbQuery = ctx.callbackQuery;
    if (!cbQuery || !("data" in cbQuery) || !cbQuery.data.startsWith("add_cur:")) {
      await ctx.answerCbQuery("Выберите валюту кнопкой").catch(() => undefined);
      return;
    }
    const currency = cbQuery.data.slice("add_cur:".length) as Currency;
    await ctx.answerCbQuery();
    const state = getState(ctx);
    state.currency = currency;
    await ctx.reply("Дата:", dateKeyboard());
    return ctx.wizard.next();
  },
  async (ctx) => {
    const state = getState(ctx);

    if (state.awaitingCustomDate) {
      if (!ctx.message || !("text" in ctx.message)) {
        await ctx.reply("Введите дату в формате ДД.ММ.ГГГГ, например 17.05.2026");
        return;
      }
      const parsed = parseDisplayDate(ctx.message.text);
      if (!parsed) {
        await ctx.reply("Не понял дату. Формат: ДД.ММ.ГГГГ, например 17.05.2026");
        return;
      }
      state.expenseDateISO = toISODate(parsed);
      state.expenseDateDisplay = toDisplayDate(parsed);
      state.awaitingCustomDate = false;
      await showSummary(ctx);
      return ctx.wizard.next();
    }

    const cbQuery = ctx.callbackQuery;
    if (!cbQuery || !("data" in cbQuery) || !cbQuery.data.startsWith("add_date:")) {
      await ctx.answerCbQuery("Выберите вариант кнопкой").catch(() => undefined);
      return;
    }
    const choice = cbQuery.data.slice("add_date:".length);
    await ctx.answerCbQuery();

    if (choice === "today") {
      const d = today();
      state.expenseDateISO = toISODate(d);
      state.expenseDateDisplay = toDisplayDate(d);
      await showSummary(ctx);
      return ctx.wizard.next();
    }
    if (choice === "yesterday") {
      const d = yesterday();
      state.expenseDateISO = toISODate(d);
      state.expenseDateDisplay = toDisplayDate(d);
      await showSummary(ctx);
      return ctx.wizard.next();
    }
    if (choice === "custom") {
      state.awaitingCustomDate = true;
      await ctx.reply("Введите дату в формате ДД.ММ.ГГГГ, например 17.05.2026");
      return;
    }

    await ctx.reply("Выберите вариант кнопкой");
    return;
  },
  async (ctx) => {
    const cbQuery = ctx.callbackQuery;
    if (!cbQuery || !("data" in cbQuery) || !cbQuery.data.startsWith("add_confirm:")) {
      await ctx.answerCbQuery("Выберите вариант кнопкой").catch(() => undefined);
      return;
    }
    const choice = cbQuery.data.slice("add_confirm:".length);
    await ctx.answerCbQuery();

    if (choice === "no") {
      await ctx.reply("Отменено.");
      return ctx.scene.leave();
    }

    const state = getState(ctx);
    if (
      !state.item ||
      state.amount === undefined ||
      !state.category ||
      !state.currency ||
      !state.expenseDateISO
    ) {
      await ctx.reply("Что-то пошло не так, начните заново через /add");
      return ctx.scene.leave();
    }

    const outcome = await submitExpense({
      item: state.item,
      amount: state.amount,
      currency: state.currency,
      category: state.category,
      expense_date: state.expenseDateISO,
    });

    if (outcome === "sent") {
      await ctx.reply("Записано ✅");
    } else {
      await ctx.reply("База недоступна, сохранил локально, отправлю позже ⏳");
    }

    return ctx.scene.leave();
  },
);

addExpenseWizard.command("cancel", async (ctx) => {
  await ctx.reply("Диалог отменён.");
  return ctx.scene.leave();
});
