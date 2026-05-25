const CONDITION_LABELS: Record<string, string> = {
  Excellent: "Отличное состояние",
  "Very good": "Очень хорошее состояние",
  Good: "Хорошее состояние",
  Fair: "Нормальное состояние",
};

export const getConditionLabel = (condition: string) =>
  CONDITION_LABELS[condition] ?? condition;
