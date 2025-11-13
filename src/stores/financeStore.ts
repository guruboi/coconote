import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Expense, Income, Budget } from '@/types/user.types';

interface FinanceState {
  expenses: Expense[];
  incomes: Income[];
  budgets: Budget[];

  // Expenses
  addExpense: (expense: Expense) => void;
  updateExpense: (expenseId: string, updates: Partial<Expense>) => void;
  deleteExpense: (expenseId: string) => void;
  getExpensesByFarm: (farmId: string) => Expense[];
  getExpensesByDateRange: (startDate: Date, endDate: Date) => Expense[];

  // Income
  addIncome: (income: Income) => void;
  updateIncome: (incomeId: string, updates: Partial<Income>) => void;
  deleteIncome: (incomeId: string) => void;
  getIncomesByFarm: (farmId: string) => Income[];

  // Budgets
  addBudget: (budget: Budget) => void;
  updateBudget: (budgetId: string, updates: Partial<Budget>) => void;
  getBudget: (month: number, year: number, farmId?: string) => Budget | null;

  // Calculations
  getTotalExpense: (farmId?: string) => number;
  getTotalIncome: (farmId?: string) => number;
  getNetProfit: (farmId?: string) => number;
}

export const useFinanceStore = create<FinanceState>()(
  persist(
    (set, get) => ({
      expenses: [],
      incomes: [],
      budgets: [],

      addExpense: (expense) => set((state) => ({
        expenses: [...state.expenses, expense],
      })),

      updateExpense: (expenseId, updates) => set((state) => ({
        expenses: state.expenses.map((expense) =>
          expense.id === expenseId ? { ...expense, ...updates } : expense
        ),
      })),

      deleteExpense: (expenseId) => set((state) => ({
        expenses: state.expenses.filter((expense) => expense.id !== expenseId),
      })),

      getExpensesByFarm: (farmId) => {
        const { expenses } = get();
        return expenses.filter((expense) => expense.farmId === farmId);
      },

      getExpensesByDateRange: (startDate, endDate) => {
        const { expenses } = get();
        return expenses.filter(
          (expense) => expense.date >= startDate && expense.date <= endDate
        );
      },

      addIncome: (income) => set((state) => ({
        incomes: [...state.incomes, income],
      })),

      updateIncome: (incomeId, updates) => set((state) => ({
        incomes: state.incomes.map((income) =>
          income.id === incomeId ? { ...income, ...updates } : income
        ),
      })),

      deleteIncome: (incomeId) => set((state) => ({
        incomes: state.incomes.filter((income) => income.id !== incomeId),
      })),

      getIncomesByFarm: (farmId) => {
        const { incomes } = get();
        return incomes.filter((income) => income.farmId === farmId);
      },

      addBudget: (budget) => set((state) => ({
        budgets: [...state.budgets, budget],
      })),

      updateBudget: (budgetId, updates) => set((state) => ({
        budgets: state.budgets.map((budget) =>
          budget.id === budgetId ? { ...budget, ...updates } : budget
        ),
      })),

      getBudget: (month, year, farmId) => {
        const { budgets } = get();
        return (
          budgets.find(
            (budget) =>
              budget.month === month &&
              budget.year === year &&
              (farmId ? budget.farmId === farmId : true)
          ) || null
        );
      },

      getTotalExpense: (farmId) => {
        const { expenses } = get();
        return expenses
          .filter((expense) => (farmId ? expense.farmId === farmId : true))
          .reduce((sum, expense) => sum + expense.amount, 0);
      },

      getTotalIncome: (farmId) => {
        const { incomes } = get();
        return incomes
          .filter((income) => (farmId ? income.farmId === farmId : true))
          .reduce((sum, income) => sum + income.amount, 0);
      },

      getNetProfit: (farmId) => {
        const { getTotalIncome, getTotalExpense } = get();
        return getTotalIncome(farmId) - getTotalExpense(farmId);
      },
    }),
    {
      name: 'coconotecc-finance',
    }
  )
);
