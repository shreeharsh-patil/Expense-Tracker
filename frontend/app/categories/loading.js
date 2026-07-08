export default function CategoriesLoading() {
  return (
    <section className="px-4 sm:px-6 py-12 max-w-4xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-200 dark:bg-dark-border" />
            <div className="h-7 w-48 bg-slate-200 dark:bg-dark-border rounded" />
          </div>
          <div className="h-4 w-64 bg-slate-200 dark:bg-dark-border rounded" />
        </div>
      </div>

      <div className="card-apple p-6 mb-8 border-white/60 dark:border-white/5">
        <div className="h-4 w-36 bg-slate-200 dark:bg-dark-border rounded mb-4" />
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[180px] space-y-2">
            <div className="h-2.5 w-12 bg-slate-200 dark:bg-dark-border rounded" />
            <div className="h-[42px] w-full bg-slate-200 dark:bg-dark-border rounded-xl" />
          </div>
          <div className="w-24 space-y-2">
            <div className="h-2.5 w-8 bg-slate-200 dark:bg-dark-border rounded" />
            <div className="h-[42px] w-full bg-slate-200 dark:bg-dark-border rounded-xl" />
          </div>
          <div className="w-20 space-y-2">
            <div className="h-2.5 w-10 bg-slate-200 dark:bg-dark-border rounded" />
            <div className="h-[42px] w-full bg-slate-200 dark:bg-dark-border rounded-xl" />
          </div>
          <div className="h-[42px] w-36 bg-slate-200 dark:bg-dark-border rounded-xl" />
        </div>
      </div>

      <div className="card-apple overflow-hidden border-white/60 dark:border-white/5 divide-y divide-slate-100 dark:divide-dark-border/10">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-dark-border shrink-0" />
              <div className="space-y-1.5">
                <div className="h-4 w-32 bg-slate-200 dark:bg-dark-border rounded" />
                <div className="h-2.5 w-16 bg-slate-200 dark:bg-dark-border rounded" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-slate-200 dark:bg-dark-border rounded-lg" />
              <div className="w-8 h-8 bg-slate-200 dark:bg-dark-border rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
