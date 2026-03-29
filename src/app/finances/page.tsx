'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { motion } from 'motion/react';
import { Plus, Upload, FolderPlus, Settings, SlidersHorizontal } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { PeriodSelector } from '@/components/finances/PeriodSelector';
import { FinanceSummaryCard } from '@/components/finances/FinanceSummaryCard';
import type { BudgetAlert } from '@/components/finances/FinanceSummaryCard';
import { DonutChart } from '@/components/finances/DonutChart';
import { BarChart } from '@/components/finances/BarChart';
import { CategoryBudgetProgress } from '@/components/finances/CategoryBudgetProgress';
import { TransactionFilters } from '@/components/finances/TransactionFilters';
import { TransactionList } from '@/components/finances/TransactionList';
import { TransactionForm } from '@/components/finances/TransactionForm';
import { FinanceCategoryForm } from '@/components/finances/FinanceCategoryForm';
import { FinanceSettingsModal } from '@/components/finances/FinanceSettingsModal';
import { ImportModal } from '@/components/finances/ImportModal';
import { ClassificationRulesModal } from '@/components/finances/ClassificationRulesModal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useFinanceCategories } from '@/lib/hooks/useFinanceCategories';
import { useTransactions } from '@/lib/hooks/useTransactions';
import { useClassificationRules } from '@/lib/hooks/useClassificationRules';
import { useTransactionFilters } from '@/lib/hooks/useTransactionFilters';
import { useCurrency } from '@/lib/hooks/useCurrency';
import { useImportParser } from '@/lib/hooks/useImportParser';
import { hashTransaction } from '@/lib/utils/hashTransaction';
import type { TransactionFormData, TransactionWithCategory, FinanceCategoryFormData, FinanceCategory, PeriodView } from '@/lib/types/database';
import { currentPeriodStr, getPeriodSummaryLabel, todayStr, daysAgoStr } from '@/lib/utils/finance';

const CURRENCIES = [
  { code: 'BOB', label: 'Bs (Bolivianos)' },
  { code: 'USD', label: '$ (Dólares)' },
  { code: 'EUR', label: '€ (Euros)' },
  { code: 'MXN', label: '$ (Pesos MX)' },
  { code: 'ARS', label: '$ (Pesos AR)' },
  { code: 'COP', label: '$ (Pesos CO)' },
  { code: 'PEN', label: 'S/ (Soles)' },
  { code: 'CLP', label: '$ (Pesos CL)' },
];

export default function FinancesPage() {
  const {
    currency,
    fetchCurrency,
    setCurrency,
    formatAmount,
    financeCycleDay,
    setFinanceCycleDay,
    monthlyBudget,
    setMonthlyBudget,
  } = useCurrency();

  const {
    categories,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
  } = useFinanceCategories();

  const {
    transactions,
    loading,
    currentPeriod,
    setCurrentPeriod,
    periodView,
    setPeriodView,
    fetchTransactions,
    summary,
    expenseBreakdown,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    bulkCreateTransactions,
    periodTotals,
    fetchPeriodTotals,
    fetchExistingHashes,
    customRange,
    setCustomRange,
  } = useTransactions(financeCycleDay);

  const { rules, fetchRules, createRule, deleteRule } = useClassificationRules();
  const {
    filteredTransactions,
    searchQuery, setSearchQuery,
    typeFilter, setTypeFilter,
    categoryFilter, setCategoryFilter,
  } = useTransactionFilters(transactions);

  const [existingHashes, setExistingHashes] = useState<Set<string>>(new Set());
  const importParser = useImportParser(categories, rules, existingHashes);

  // Modals
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<TransactionWithCategory | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<FinanceCategory | null>(null);
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null);

  // Budget alerts
  const budgetAlerts: BudgetAlert[] = useMemo(() => {
    const alerts: BudgetAlert[] = [];
    for (const cat of expenseBreakdown) {
      if (cat.spending_limit && cat.spending_limit > 0) {
        const pct = Math.round((cat.total / cat.spending_limit) * 100);
        if (pct >= 80) {
          alerts.push({ name: cat.category_name, emoji: cat.category_emoji, percentage: pct });
        }
      }
    }
    // Global budget alert
    if (monthlyBudget && monthlyBudget > 0) {
      const pct = Math.round((summary.totalExpense / monthlyBudget) * 100);
      if (pct >= 80) {
        alerts.unshift({ name: 'Presupuesto total', emoji: '💰', percentage: pct });
      }
    }
    return alerts;
  }, [expenseBreakdown, monthlyBudget, summary.totalExpense]);

  // Initial fetch
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchCategories();
    fetchRules();
    fetchCurrency();
  }, []);

  // Fetch transactions + chart whenever period/view/range changes
  useEffect(() => {
    fetchTransactions();
    fetchPeriodTotals();
  }, [currentPeriod, periodView, customRange, fetchTransactions, fetchPeriodTotals]);

  const handlePeriodChange = useCallback((period: string) => {
    setCurrentPeriod(period);
  }, [setCurrentPeriod]);

  const handleViewChange = useCallback((view: PeriodView) => {
    setPeriodView(view);
    if (view === 'custom') {
      setCustomRange({ from: daysAgoStr(30), to: todayStr() });
    } else {
      setCustomRange(null);
      setCurrentPeriod(currentPeriodStr(view, financeCycleDay));
    }
  }, [setPeriodView, setCurrentPeriod, setCustomRange, financeCycleDay]);

  const handleEditTransaction = async (data: TransactionFormData) => {
    if (!editingTransaction) return false;
    const result = await updateTransaction(editingTransaction.id, data);
    if (result) setEditingTransaction(null);
    return result;
  };

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;
    await deleteTransaction(deletingId);
    setDeletingId(null);
  };

  const handleOpenImport = async () => {
    const hashes = await fetchExistingHashes();
    setExistingHashes(hashes);
    setShowImport(true);
  };

  const handleConfirmImport = async () => {
    const selected = importParser.getSelectedRows();
    const rows = await Promise.all(
      selected.map(async r => {
        const hash = await hashTransaction(r.date, r.description, r.amount);
        return {
          type: r.type,
          amount: r.amount,
          description: r.description,
          date: r.date,
          category_id: r.suggestedCategory?.id,
          import_hash: hash,
        };
      })
    );
    await bulkCreateTransactions(rows);
    importParser.reset();
  };

  const handleEditCategory = async (data: FinanceCategoryFormData) => {
    if (!editingCategory) return false;
    const result = await updateCategory(editingCategory.id, data);
    if (result) {
      setEditingCategory(null);
      await fetchTransactions(currentPeriod);
    }
    return result;
  };

  const handleDeleteCategory = async () => {
    if (!deletingCategoryId) return;
    await deleteCategory(deletingCategoryId);
    setDeletingCategoryId(null);
    await fetchTransactions(currentPeriod);
  };

  return (
    <div className="min-h-screen mesh-bg">
      <Header />

      <main className="pt-24 pb-24 sm:pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Top bar: month selector + actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <PeriodSelector
            period={currentPeriod}
            view={periodView}
            onPeriodChange={handlePeriodChange}
            onViewChange={handleViewChange}
            customRange={customRange}
            onCustomRangeChange={setCustomRange}
          />
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setShowCurrencyPicker(p => !p)}
              className="glass-button rounded-xl px-3 py-2 text-xs font-medium hover:scale-105 transition-transform"
            >
              {currency}
            </button>
            <button
              onClick={handleOpenImport}
              className="glass-button rounded-xl px-3 py-2 text-xs font-medium hover:scale-105 transition-transform flex items-center gap-1.5"
            >
              <Upload size={14} />
              Importar
            </button>
            <button
              onClick={() => setShowCategoryForm(true)}
              className="glass-button rounded-xl px-3 py-2 text-xs font-medium hover:scale-105 transition-transform flex items-center gap-1.5"
            >
              <FolderPlus size={14} />
              Categoría
            </button>
            <button
              onClick={() => setShowRules(true)}
              className="glass-button rounded-xl px-3 py-2 text-xs font-medium hover:scale-105 transition-transform flex items-center gap-1.5"
            >
              <Settings size={14} />
              Reglas
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="glass-button rounded-xl px-3 py-2 text-xs font-medium hover:scale-105 transition-transform flex items-center gap-1.5"
            >
              <SlidersHorizontal size={14} />
              Ajustes
            </button>
          </div>
        </div>

        {/* Currency picker dropdown */}
        {showCurrencyPicker && (
          <div className="mb-4 flex flex-wrap gap-1.5">
            {CURRENCIES.map(c => (
              <button
                key={c.code}
                onClick={() => { setCurrency(c.code); setShowCurrencyPicker(false); }}
                className={`px-3 py-1.5 rounded-xl text-xs transition-all ${
                  currency === c.code
                    ? 'bg-emerald-500 text-white'
                    : 'glass-button text-muted-foreground hover:text-foreground'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        )}

        {/* Finance categories - editable chips */}
        {categories.length > 0 && (
          <div className="mb-6">
            <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Categorías</p>
            <div className="flex flex-wrap gap-2">
              {categories.map(cat => (
                <div
                  key={cat.id}
                  className="glass-button rounded-xl px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 group cursor-pointer hover:scale-105 transition-transform"
                  style={{ borderLeft: `3px solid ${cat.color}` }}
                  onClick={() => setEditingCategory(cat)}
                >
                  <span>{cat.emoji || '📁'}</span>
                  <span>{cat.name}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeletingCategoryId(cat.id); }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-rose-400 hover:text-rose-500 ml-1"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Summary + Donut grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <FinanceSummaryCard
            summary={summary}
            formatAmount={formatAmount}
            periodLabel={getPeriodSummaryLabel(periodView)}
            className="lg:col-span-2"
            budgetAlerts={budgetAlerts}
          />
          <div className="glass-card p-6">
            <h3 className="text-sm font-semibold mb-4">Gastos por categoría</h3>
            <DonutChart
              data={expenseBreakdown}
              total={formatAmount(summary.totalExpense)}
            />
          </div>
        </div>

        {/* Budget progress bars */}
        <CategoryBudgetProgress
          breakdown={expenseBreakdown}
          formatAmount={formatAmount}
          monthlyBudget={monthlyBudget}
          totalExpense={summary.totalExpense}
        />

        {/* Bar chart */}
        {periodTotals.length > 0 && (
          <div className="glass-card p-6 mb-6">
            <h3 className="text-sm font-semibold mb-4">Ingresos vs Egresos</h3>
            <BarChart data={periodTotals} formatAmount={formatAmount} />
          </div>
        )}

        {/* Filters */}
        <div className="mb-2">
          <h3 className="text-sm font-semibold mb-3">Transacciones</h3>
          <TransactionFilters
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            typeFilter={typeFilter}
            setTypeFilter={setTypeFilter}
            categoryFilter={categoryFilter}
            setCategoryFilter={setCategoryFilter}
            categories={categories}
          />
        </div>

        {/* Transaction list */}
        <TransactionList
          transactions={filteredTransactions}
          loading={loading}
          formatAmount={formatAmount}
          onEdit={t => setEditingTransaction(t)}
          onDelete={id => setDeletingId(id)}
        />
      </main>

      {/* FAB: New transaction */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', delay: 0.5 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setShowTransactionForm(true)}
        className="fixed bottom-8 right-8 w-14 h-14 rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/25 flex items-center justify-center z-30"
      >
        <Plus size={24} />
      </motion.button>

      {/* Modals */}
      <TransactionForm
        open={showTransactionForm}
        onClose={() => setShowTransactionForm(false)}
        onSubmit={createTransaction}
        mode="create"
        categories={categories}
      />

      {editingTransaction && (
        <TransactionForm
          open={!!editingTransaction}
          onClose={() => setEditingTransaction(null)}
          onSubmit={handleEditTransaction}
          mode="edit"
          categories={categories}
          initial={{
            type: editingTransaction.type,
            amount: editingTransaction.amount,
            description: editingTransaction.description,
            date: editingTransaction.date,
            category_id: editingTransaction.category_id ?? undefined,
          }}
        />
      )}

      <FinanceCategoryForm
        open={showCategoryForm}
        onClose={() => setShowCategoryForm(false)}
        onSubmit={createCategory}
        mode="create"
      />

      <ImportModal
        open={showImport}
        onClose={() => setShowImport(false)}
        previewRows={importParser.previewRows}
        parsing={importParser.parsing}
        parseError={importParser.parseError}
        onParseFile={importParser.parseFile}
        onToggleRow={importParser.toggleRow}
        onUpdateRowCategory={importParser.updateRowCategory}
        onConfirmImport={handleConfirmImport}
        onReset={importParser.reset}
        onOpenRules={() => { setShowImport(false); setShowRules(true); }}
        categories={categories}
        formatAmount={formatAmount}
      />

      <FinanceSettingsModal
        open={showSettings}
        onClose={() => setShowSettings(false)}
        cycleDay={financeCycleDay}
        onCycleDayChange={setFinanceCycleDay}
        monthlyBudget={monthlyBudget}
        onMonthlyBudgetChange={setMonthlyBudget}
      />

      <ClassificationRulesModal
        open={showRules}
        onClose={() => setShowRules(false)}
        rules={rules}
        categories={categories}
        onCreateRule={createRule}
        onDeleteRule={deleteRule}
      />

      {editingCategory && (
        <FinanceCategoryForm
          open={!!editingCategory}
          onClose={() => setEditingCategory(null)}
          onSubmit={handleEditCategory}
          mode="edit"
          initial={{
            name: editingCategory.name,
            emoji: editingCategory.emoji ?? undefined,
            color: editingCategory.color,
            type: editingCategory.type,
            spending_limit: editingCategory.spending_limit,
          }}
        />
      )}

      <ConfirmDialog
        open={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDeleteConfirm}
        title="¿Eliminar transacción?"
        description="Esta acción no se puede deshacer."
      />

      <ConfirmDialog
        open={!!deletingCategoryId}
        onClose={() => setDeletingCategoryId(null)}
        onConfirm={handleDeleteCategory}
        title="¿Eliminar categoría?"
        description="Las transacciones asociadas quedarán sin categoría. Esta acción no se puede deshacer."
      />
    </div>
  );
}
