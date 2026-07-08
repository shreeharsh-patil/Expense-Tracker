export default function ReceiptGalleryLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in">
      <section className="mb-8 md:mb-12 flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-6">
        <div className="space-y-3">
          <div className="h-4 w-28 bg-slate-200 dark:bg-dark-border rounded" />
          <div className="h-7 w-52 bg-slate-200 dark:bg-dark-border rounded" />
          <div className="h-4 w-64 bg-slate-200 dark:bg-dark-border rounded" />
        </div>
        <div className="h-10 w-32 bg-slate-200 dark:bg-dark-border rounded-xl" />
      </section>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="card-apple p-0 overflow-hidden">
            <div className="aspect-[3/4] bg-slate-200 dark:bg-dark-border" />
            <div className="p-3 md:p-4 space-y-2">
              <div className="h-3 w-3/4 bg-slate-200 dark:bg-dark-border rounded" />
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-20 bg-slate-200 dark:bg-dark-border rounded" />
                <div className="h-2.5 w-16 bg-slate-200 dark:bg-dark-border rounded" />
              </div>
              <div className="pt-3 border-t border-slate-100 dark:border-dark-border/40 flex justify-between">
                <div className="h-4 w-8 bg-slate-200 dark:bg-dark-border rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
