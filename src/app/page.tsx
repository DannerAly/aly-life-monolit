'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { BentoGrid } from '@/components/layout/BentoGrid';
import { CategoryForm } from '@/components/categories/CategoryForm';
import { useCategories } from '@/lib/hooks/useCategories';

export default function HomePage() {
  const { categories, loading, fetchCategories, createCategory } = useCategories();
  const [showCategoryForm, setShowCategoryForm] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return (
    <div className="min-h-screen mesh-bg">
      <Header />

      <main className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {loading ? (
          <BentoGrid.Skeleton />
        ) : (
          <BentoGrid
            categories={categories}
            onAddCategory={() => setShowCategoryForm(true)}
          />
        )}
      </main>

      <CategoryForm
        open={showCategoryForm}
        onClose={() => setShowCategoryForm(false)}
        onSubmit={createCategory}
        mode="create"
      />
    </div>
  );
}
