"use client";

import { useMemo, useState, type FormEvent } from "react";
import { Heart, LoaderCircle, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import { useFavorites } from "@/hooks/useFavorites";

type ItemActionsProps = {
  itemId: string;
  itemSlug: string;
};

type ReservationResponse = {
  success: boolean;
  data: {
    id: string;
  } | null;
  error: string | null;
};

const emptyForm = {
  customerName: "",
  contact: "",
  message: "",
};

export const ItemActions = ({ itemId, itemSlug }: ItemActionsProps) => {
  const { isFavorite, toggleFavorite } = useFavorites();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [formValues, setFormValues] = useState(emptyForm);

  const itemSaved = isFavorite(itemSlug);

  const resetModalState = () => {
    setFormValues(emptyForm);
    setErrorMessage(null);
    setFeedback(null);
  };

  const openModal = () => {
    resetModalState();
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleFieldChange = (
    field: "customerName" | "contact" | "message",
    value: string,
  ) => {
    setFormValues((current) => ({ ...current, [field]: value }));
  };

  const sendReservation = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    setFeedback(null);

    try {
      const response = await fetch("/api/reservations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          itemId,
          customerName: formValues.customerName,
          contact: formValues.contact,
          message: formValues.message,
        }),
      });

      const payload = (await response.json()) as ReservationResponse;

      if (!response.ok || !payload.success) {
        throw new Error(payload.error ?? "Не удалось отправить заявку.");
      }

      setFeedback("Заявка отправлена. Магазин скоро свяжется с тобой.");
      setFormValues(emptyForm);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Не удалось отправить заявку.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const saveButtonLabel = useMemo(
    () => (itemSaved ? "Сохранено" : "Сохранить"),
    [itemSaved],
  );

  return (
    <>
      <div className="mt-8 space-y-3 pb-2">
        <button
          type="button"
          onClick={openModal}
          className="w-full rounded-2xl bg-primary px-5 py-4 text-sm font-semibold tracking-[0.08em] text-background transition-transform active:scale-[0.98]"
        >
          Забронировать вещь
        </button>
        <button
          type="button"
          onClick={() => toggleFavorite(itemSlug)}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-card px-5 py-4 text-sm font-semibold text-primary transition-colors hover:bg-accent/20 active:scale-[0.98]"
        >
          <Heart className={`h-4 w-4 ${itemSaved ? "fill-primary" : ""}`} />
          {saveButtonLabel}
        </button>
      </div>

      <AnimatePresence>
        {isModalOpen ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-primary/40 px-4 pb-4 pt-10 backdrop-blur-sm"
          >
            <motion.div
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 18, opacity: 0 }}
              transition={{ type: "spring", stiffness: 240, damping: 24 }}
              className="relative w-full max-w-[430px] rounded-[30px] border border-border bg-card p-5 shadow-[0_24px_52px_rgba(61,49,49,0.24)]"
            >
              <button
                type="button"
                onClick={closeModal}
                aria-label="Закрыть форму бронирования"
                className="absolute right-4 top-4 rounded-full border border-border bg-background p-2 text-muted transition-colors hover:text-primary"
              >
                <X className="h-4 w-4" />
              </button>

              <h3 className="text-lg font-semibold text-primary">Забронировать вещь</h3>
              <p className="mt-1 text-sm text-muted">
                Оставь контакт, и магазин свяжется с тобой.
              </p>

              <form className="mt-4 space-y-3" onSubmit={sendReservation}>
                <label className="block">
                  <span className="mb-1.5 block text-xs uppercase tracking-[0.1em] text-muted">
                    Имя (необязательно)
                  </span>
                  <input
                    value={formValues.customerName}
                    onChange={(event) =>
                      handleFieldChange("customerName", event.target.value)
                    }
                    type="text"
                    className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-primary placeholder:text-muted/70"
                    placeholder="Твое имя"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-xs uppercase tracking-[0.1em] text-muted">
                    Контакт (необязательно)
                  </span>
                  <input
                    value={formValues.contact}
                    onChange={(event) => handleFieldChange("contact", event.target.value)}
                    type="text"
                    className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-primary placeholder:text-muted/70"
                    placeholder="Телеграм, телефон или email"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-xs uppercase tracking-[0.1em] text-muted">
                    Сообщение (необязательно)
                  </span>
                  <textarea
                    value={formValues.message}
                    onChange={(event) => handleFieldChange("message", event.target.value)}
                    rows={3}
                    className="w-full resize-none rounded-2xl border border-border bg-background px-4 py-3 text-sm text-primary placeholder:text-muted/70"
                    placeholder="Можно уточнить время или детали"
                  />
                </label>

                {feedback ? (
                  <p className="rounded-2xl border border-border bg-background px-4 py-3 text-sm text-primary">
                    {feedback}
                  </p>
                ) : null}

                {errorMessage ? (
                  <p className="rounded-2xl border border-border bg-background px-4 py-3 text-sm text-primary">
                    {errorMessage}
                  </p>
                ) : null}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3.5 text-sm font-semibold tracking-[0.08em] text-background transition-opacity disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSubmitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
                  Отправить заявку
                </button>
              </form>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
};
