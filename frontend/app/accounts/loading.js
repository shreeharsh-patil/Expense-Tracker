export default function AccountsLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in">
      <section className="mb-8 md:mb-12 flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-6">
        <div className="space-y-3">
          <div className="h-4 w-28 bg-slate-200 dark:bg-dark-border rounded" />
          <div className="h-7 w-48 bg-slate-200 dark:bg-dark-border rounded" />
          <div className="h-4 w-72 bg-slate-200 dark:bg-dark-border rounded" />
        </div>
        <div className="h-10 w-36 bg-slate-200 dark:bg-dark-border rounded-xl" />
      </section>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="card-apple p-5 md:p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-dark-border" />
                <div className="space-y-2">
                  <div className="h-4 w-28 bg-slate-200 dark:bg-dark-border rounded" />
                  <div className="h-2.5 w-16 bg-slate-200 dark:bg-dark-border rounded" />
                </div>
              </div>
              <div className="w-4 h-4 bg-slate-200 dark:bg-dark-border rounded" />
            </div>
            <div className="mt-auto pt-4 border-t border-slate-100 dark:border-dark-border/40 space-y-2">
              <div className="h-2.5 w-20 bg-slate-200 dark:bg-dark-border rounded" />
              <div className="h-7 w-36 bg-slate-200 dark:bg-dark-border rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
