export default function RulesLoading() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div className="space-y-3">
          <div className="h-7 w-36 bg-slate-200 dark:bg-dark-border rounded" />
          <div className="h-4 w-72 bg-slate-200 dark:bg-dark-border rounded" />
        </div>
      </div>

      <div className="card-apple p-6 mb-8 border-white/60 dark:border-white/5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-2.5 w-20 bg-slate-200 dark:bg-dark-border rounded" />
              <div className="h-10 w-full bg-slate-200 dark:bg-dark-border rounded border-b" />
            </div>
          ))}
        </div>
        <div className="h-10 w-28 bg-slate-200 dark:bg-dark-border rounded-xl mt-4" />
      </div>

      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="card-apple p-4 flex items-center justify-between border-white/60 dark:border-white/5">
            <div className="flex-1 space-y-2">
              <div className="h-4 w-44 bg-slate-200 dark:bg-dark-border rounded" />
              <div className="h-3 w-64 bg-slate-200 dark:bg-dark-border rounded font-mono" />
            </div>
            <div className="flex items-center gap-2">
              <div className="h-6 w-16 bg-slate-200 dark:bg-dark-border rounded-lg" />
              <div className="w-8 h-8 bg-slate-200 dark:bg-dark-border rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
