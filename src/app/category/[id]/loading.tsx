import { Header } from '@/components/layout/Header';

export default function CategoryLoading() {
  return (
    <div className="min-h-screen mesh-bg">
      <Header />
      <main className="pt-24 pb-24 sm:pb-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        {/* Header skeleton */}
        <div className="glass-card h-36 animate-pulse mb-6 rounded-3xl" />

        {/* Filters skeleton */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="flex-1 h-11 glass-card animate-pulse rounded-xl" />
          <div className="h-11 w-full sm:w-64 glass-card animate-pulse rounded-2xl" />
        </div>

        {/* Task items skeleton */}
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="glass-card h-20 animate-pulse rounded-2xl"
              style={{ animationDelay: `${i * 80}ms` }}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
