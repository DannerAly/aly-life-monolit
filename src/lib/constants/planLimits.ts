export const PLAN_LIMITS = {
  free: {
    categories: 3,
    habits: 3,
    financeCategories: 5,
    savingsGoals: 1,
    transactionHistoryDays: 30,
    csvImport: false,
    classificationRules: false,
  },
  pro: {
    categories: Infinity,
    habits: Infinity,
    financeCategories: Infinity,
    savingsGoals: Infinity,
    transactionHistoryDays: Infinity,
    csvImport: true,
    classificationRules: true,
  },
} as const;

export type PlanType = 'free' | 'pro';
