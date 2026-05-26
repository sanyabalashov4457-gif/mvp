"use client";

import { Heart, Sparkles, X } from "lucide-react";
import { motion } from "framer-motion";

type ActionButtonsProps = {
  onSkip: () => void;
  onSave: () => void;
  onDetails: () => void;
  disabled?: boolean;
};

const baseButtonClassName =
  "flex items-center justify-center rounded-full border border-border bg-card text-primary shadow-[0_10px_24px_rgba(61,49,49,0.08)] transition-colors hover:bg-accent/20 disabled:cursor-not-allowed disabled:opacity-60";

export const ActionButtons = ({
  onSkip,
  onSave,
  onDetails,
  disabled = false,
}: ActionButtonsProps) => {
  return (
    <div className="mt-5">
      <div className="flex items-center justify-center gap-4">
        <motion.button
          type="button"
          whileTap={{ scale: 0.92 }}
          whileHover={{ scale: 1.04 }}
          className={`${baseButtonClassName} h-12 w-12`}
          onClick={onSkip}
          disabled={disabled}
          aria-label="Пропустить"
        >
          <X className="h-5 w-5" />
        </motion.button>

        <motion.button
          type="button"
          whileTap={{ scale: 0.92 }}
          whileHover={{ scale: 1.04 }}
          className={`${baseButtonClassName} h-14 w-14`}
          onClick={onDetails}
          disabled={disabled}
          aria-label="Подробнее"
        >
          <Sparkles className="h-5 w-5" />
        </motion.button>

        <motion.button
          type="button"
          whileTap={{ scale: 0.92 }}
          whileHover={{ scale: 1.04 }}
          className={`${baseButtonClassName} h-12 w-12`}
          onClick={onSave}
          disabled={disabled}
          aria-label="Сохранить"
        >
          <Heart className="h-5 w-5" />
        </motion.button>
      </div>

      <div className="mt-2 grid grid-cols-3 text-center text-[0.66rem] uppercase tracking-[0.1em] text-muted">
        <span>Пропустить</span>
        <span>Подробнее</span>
        <span>Сохранить</span>
      </div>
    </div>
  );
};
