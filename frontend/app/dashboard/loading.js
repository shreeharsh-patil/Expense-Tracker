export default function DashboardLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in">
      {/* Top Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-10">
        <div className="card-apple p-6 md:p-8 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="h-3 w-24 bg-slate-200 dark:bg-dark-border rounded" />
            <div className="h-7 w-48 bg-slate-200 dark:bg-dark-border rounded" />
            <div className="h-3 w-64 bg-slate-200 dark:bg-dark-border rounded mt-2" />
          </div>
          <div className="mt-6 md:mt-8 flex gap-2 md:gap-3">
            <div className="h-10 w-24 bg-slate-200 dark:bg-dark-border rounded-xl" />
            <div className="h-10 w-28 bg-slate-200 dark:bg-dark-border rounded-xl" />
          </div>
        </div>
        <div className="card-apple p-6 md:p-8">
          <div className="space-y-2">
            <div className="h-3 w-20 bg-slate-200 dark:bg-dark-border rounded" />
            <div className="h-8 w-32 bg-slate-200 dark:bg-dark-border rounded mt-3" />
          </div>
          <div className="mt-4 md:mt-6 pt-3 md:pt-4 border-t border-slate-100 dark:border-dark-border/40 space-y-2">
            <div className="h-3 w-full bg-slate-200 dark:bg-dark-border rounded" />
            <div className="h-3 w-3/4 bg-slate-200 dark:bg-dark-border rounded" />
          </div>
        </div>
        <div className="card-apple p-6 md:p-8">
          <div className="space-y-2">
            <div className="h-3 w-20 bg-slate-200 dark:bg-dark-border rounded" />
            <div className="h-8 w-32 bg-slate-200 dark:bg-dark-border rounded mt-3" />
          </div>
          <div className="mt-4 md:mt-6 pt-3 md:pt-4 border-t border-slate-100 dark:border-dark-border/40 space-y-2">
            <div className="h-3 w-full bg-slate-200 dark:bg-dark-border rounded" />
            <div className="h-1.5 w-full bg-slate-200 dark:bg-dark-border rounded-full overflow-hidden">
              <div className="h-full w-2/3 bg-slate-300 dark:bg-dark-border/60 rounded-full" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          {/* Search bar */}
          <div className="card-apple p-4">
            <div className="h-10 w-full max-w-sm bg-slate-200 dark:bg-dark-border rounded-xl" />
          </div>
          {/* Table */}
          <div className="card-apple p-0 overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-dark-border/40">
              <div className="flex gap-12">
                <div className="h-3 w-20 bg-slate-200 dark:bg-dark-border rounded" />
                <div className="h-3 w-28 bg-slate-200 dark:bg-dark-border rounded" />
                <div className="h-3 w-16 bg-slate-200 dark:bg-dark-border rounded ml-auto" />
              </div>
            </div>
            <div className="divide-y divide-slate-50 dark:divide-dark-border/10">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="px-6 py-5 flex items-center gap-4">
                  <div className="h-3 w-24 bg-slate-200 dark:bg-dark-border rounded" />
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-dark-border shrink-0" />
                    <div className="space-y-1.5 flex-1">
                      <div className="h-3 w-40 bg-slate-200 dark:bg-dark-border rounded" />
                      <div className="h-2.5 w-20 bg-slate-200 dark:bg-dark-border rounded" />
                    </div>
                  </div>
                  <div className="h-4 w-20 bg-slate-200 dark:bg-dark-border rounded" />
                  <div className="h-5 w-16 bg-slate-200 dark:bg-dark-border rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-4 space-y-4 md:space-y-6">
          <div className="card-apple p-5 md:p-6 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-slate-200 dark:bg-dark-border rounded" />
              <div className="h-3 w-24 bg-slate-200 dark:bg-dark-border rounded" />
            </div>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-dark-border/40 last:border-0">
                <div className="h-3 w-20 bg-slate-200 dark:bg-dark-border rounded" />
                <div className="h-4 w-24 bg-slate-200 dark:bg-dark-border rounded" />
              </div>
            ))}
            <div className="mt-2">
              <div className="h-16 w-full bg-slate-200 dark:bg-dark-border rounded-xl" />
            </div>
          </div>
          <div className="card-apple p-5 md:p-6 space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-5 h-5 bg-slate-200 dark:bg-dark-border rounded" />
              <div className="h-3 w-20 bg-slate-200 dark:bg-dark-border rounded" />
            </div>
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex justify-between items-center py-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-slate-200 dark:bg-dark-border" />
                  <div className="h-3 w-24 bg-slate-200 dark:bg-dark-border rounded" />
                </div>
                <div className="h-3 w-20 bg-slate-200 dark:bg-dark-border rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
