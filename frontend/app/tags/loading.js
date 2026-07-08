export default function TagsLoading() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div className="space-y-3">
          <div className="h-7 w-24 bg-slate-200 dark:bg-dark-border rounded" />
          <div className="h-4 w-52 bg-slate-200 dark:bg-dark-border rounded" />
        </div>
      </div>

      <div className="card-apple p-6 mb-8 border-white/60 dark:border-white/5">
        <div className="flex items-end gap-4">
          <div className="flex-1 space-y-2">
            <div className="h-2.5 w-16 bg-slate-200 dark:bg-dark-border rounded" />
            <div className="h-[42px] w-full bg-slate-200 dark:bg-dark-border rounded border-b" />
          </div>
          <div className="space-y-2">
            <div className="h-2.5 w-10 bg-slate-200 dark:bg-dark-border rounded" />
            <div className="w-10 h-10 bg-slate-200 dark:bg-dark-border rounded-lg" />
          </div>
          <div className="h-[42px] w-28 bg-slate-200 dark:bg-dark-border rounded-xl" />
        </div>
      </div>

      <div className="space-y-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="card-apple p-4 flex items-center justify-between border-white/60 dark:border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-full bg-slate-200 dark:bg-dark-border" />
              <div className="h-4 w-28 bg-slate-200 dark:bg-dark-border rounded" />
              <div className="h-3 w-20 bg-slate-200 dark:bg-dark-border rounded" />
            </div>
            <div className="w-8 h-8 bg-slate-200 dark:bg-dark-border rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}
