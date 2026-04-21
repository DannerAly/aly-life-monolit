import { Header } from '@/components/layout/Header';

export default function HomeLoading() {
  return (
    <div className="min-h-screen mesh-bg">
      <Header />
      <main className="pt-24 pb-24 sm:pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Bento grid skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mb-8">
          <div className="glass-card col-span-2 sm:col-span-4 h-40 animate-pulse rounded-3xl" />
          <div className="glass-card col-span-2 sm:col-span-2 lg:col-span-2 h-40 animate-pulse rounded-3xl" style={{ animationDelay: '50ms' }} />
          <div className="glass-card col-span-2 lg:col-span-2 h-40 animate-pulse rounded-3xl" style={{ animationDelay: '100ms' }} />
          <div className="glass-card col-span-1 lg:col-span-2 h-20 animate-pulse rounded-2xl" style={{ animationDelay: '150ms' }} />
          <div className="glass-card col-span-1 lg:col-span-2 h-20 animate-pulse rounded-2xl" style={{ animationDelay: '200ms' }} />
          <div className="glass-card col-span-2 lg:col-span-2 h-20 animate-pulse rounded-2xl" style={{ animationDelay: '250ms' }} />
          <div className="glass-card col-span-2 lg:col-span-2 h-20 animate-pulse rounded-2xl" style={{ animationDelay: '300ms' }} />
        </div>

        {/* Global tasks skeleton */}
        <div className="mt-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-5 h-5 bg-muted/30 animate-pulse rounded" />
            <div className="w-24 h-5 bg-muted/30 animate-pulse rounded" />
          </div>
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="glass-card h-20 animate-pulse rounded-2xl"
                style={{ animationDelay: `${i * 80}ms` }}
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
