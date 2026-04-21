import { Header } from '@/components/layout/Header';

export default function FinancesLoading() {
  return (
    <div className="min-h-screen mesh-bg">
      <Header />
      <main className="pt-24 pb-24 sm:pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Top bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="h-9 w-48 glass-card animate-pulse rounded-xl" />
          <div className="flex gap-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-8 w-20 glass-card animate-pulse rounded-xl" style={{ animationDelay: `${i * 50}ms` }} />
            ))}
          </div>
        </div>

        {/* Summary + chart */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <div className="lg:col-span-2 glass-card h-56 animate-pulse rounded-3xl" />
          <div className="glass-card h-56 animate-pulse rounded-3xl" style={{ animationDelay: '100ms' }} />
        </div>

        {/* Transactions */}
        <div className="space-y-2 mt-6">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="glass-card h-16 animate-pulse rounded-2xl"
              style={{ animationDelay: `${i * 60}ms` }}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
