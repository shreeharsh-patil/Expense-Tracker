export default function ReportsLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in">
      <section className="mb-8 md:mb-12 flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-6">
        <div className="space-y-3">
          <div className="h-4 w-32 bg-slate-200 dark:bg-dark-border rounded" />
          <div className="h-7 w-64 bg-slate-200 dark:bg-dark-border rounded" />
          <div className="h-4 w-80 bg-slate-200 dark:bg-dark-border rounded" />
        </div>
        <div className="h-12 w-64 bg-slate-200 dark:bg-dark-border rounded-xl" />
      </section>

      {/* Year selector */}
      <div className="flex gap-2 mb-6">
        {[1].map((i) => (
          <div key={i} className="h-7 w-16 bg-slate-200 dark:bg-dark-border rounded-pill" />
        ))}
      </div>

      {/* Insight cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="card-apple p-5 md:p-6">
            <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-dark-border mb-4" />
            <div className="h-3 w-20 bg-slate-200 dark:bg-dark-border rounded mb-2" />
            <div className="h-6 w-16 bg-slate-200 dark:bg-dark-border rounded" />
            <div className="h-3 w-24 bg-slate-200 dark:bg-dark-border rounded mt-1" />
          </div>
        ))}
      </div>

      {/* Main content area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 items-start">
        <div className="lg:col-span-7">
          <div className="card-apple p-5 md:p-8">
            <div className="h-3 w-36 bg-slate-200 dark:bg-dark-border rounded mb-6" />
            <div className="space-y-4 md:space-y-6">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-slate-200 dark:bg-dark-border" />
                      <div className="h-3 w-24 bg-slate-200 dark:bg-dark-border rounded" />
                    </div>
                    <div className="h-3 w-20 bg-slate-200 dark:bg-dark-border rounded" />
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 dark:bg-dark-border rounded-full overflow-hidden">
                    <div className="h-full w-1/2 bg-slate-300 dark:bg-dark-border/60 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 space-y-4 md:space-y-6">
          <div className="card-apple p-5 md:p-8">
            <div className="h-3 w-32 bg-slate-200 dark:bg-dark-border rounded mb-6" />
            <div className="space-y-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-3 w-8 bg-slate-200 dark:bg-dark-border rounded shrink-0" />
                  <div className="flex-1 space-y-1">
                    <div className="h-2 w-3/4 bg-slate-200 dark:bg-dark-border rounded" />
                    <div className="h-2 w-1/2 bg-slate-200 dark:bg-dark-border rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="card-apple p-5 md:p-6 h-20 bg-slate-200 dark:bg-dark-border" />
        </div>
      </div>
    </div>
  );
}
