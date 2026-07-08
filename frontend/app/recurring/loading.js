export default function RecurringLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in">
      <section className="mb-8 md:mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-6">
        <div className="space-y-3">
          <div className="h-7 w-64 bg-slate-200 dark:bg-dark-border rounded" />
          <div className="h-4 w-72 bg-slate-200 dark:bg-dark-border rounded" />
        </div>
        <div className="h-10 w-44 bg-slate-200 dark:bg-dark-border rounded-xl" />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          <div className="card-apple p-0 overflow-hidden">
            <div className="px-5 md:px-6 py-4 border-b border-slate-100 dark:border-dark-border/40 flex items-center justify-between">
              <div className="h-3 w-32 bg-slate-200 dark:bg-dark-border rounded" />
              <div className="h-4 w-16 bg-slate-200 dark:bg-dark-border rounded-md" />
            </div>
            <div className="divide-y divide-slate-50 dark:divide-dark-border/10">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-dark-border shrink-0" />
                    <div className="space-y-1.5 flex-1">
                      <div className="h-4 w-40 bg-slate-200 dark:bg-dark-border rounded" />
                      <div className="h-2.5 w-28 bg-slate-200 dark:bg-dark-border rounded" />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-6 w-20 bg-slate-200 dark:bg-dark-border rounded-md" />
                    <div className="h-4 w-24 bg-slate-200 dark:bg-dark-border rounded" />
                    <div className="w-8 h-8 bg-slate-200 dark:bg-dark-border rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-4">
          <div className="card-apple p-8 sticky top-24 space-y-5">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-dark-border" />
              <div className="h-4 w-24 bg-slate-200 dark:bg-dark-border rounded" />
            </div>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-2.5 w-28 bg-slate-200 dark:bg-dark-border rounded" />
                <div className="h-10 w-full bg-slate-200 dark:bg-dark-border rounded border-b" />
              </div>
            ))}
            <div className="pt-4">
              <div className="h-12 w-full bg-slate-200 dark:bg-dark-border rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
