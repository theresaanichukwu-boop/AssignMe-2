export function Stepper({ steps, current }: { steps: string[]; current: number }) {
  return (
    <ol aria-label="Progress" className="flex flex-wrap items-center gap-2">
      {steps.map((step, i) => {
        const done = i < current;
        const isCurrent = i === current;
        return (
          <li key={step} className="flex items-center gap-2">
            <span
              aria-current={isCurrent ? "step" : undefined}
              className={`flex h-6 w-6 items-center justify-center rounded-pill text-xs font-semibold ${done ? "bg-teal-700 text-white" : isCurrent ? "bg-navy-950 text-white" : "bg-navy-100 text-slate-500"}`}
            >
              {done ? "✓" : i + 1}
            </span>
            <span className={`text-sm ${isCurrent ? "font-semibold" : "text-slate-500"}`}>{step}</span>
            {i < steps.length - 1 && <span aria-hidden="true" className="mx-1 h-px w-6 bg-navy-100" />}
          </li>
        );
      })}
    </ol>
  );
}

export function Progress({ value, label }: { value: number; label: string }) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span id="progress-label">{label}</span>
        <span aria-hidden="true">{clamped}%</span>
      </div>
      <div
        role="progressbar"
        aria-labelledby="progress-label"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        className="mt-1 h-2 overflow-hidden rounded-pill bg-navy-100"
      >
        <div className="h-full bg-teal-700 transition-all" style={{ width: `${clamped}%` }} />
      </div>
    </div>
  );
}

export function Skeleton({ className = "", label = "Loading" }: { className?: string; label?: string }) {
  return (
    <div role="status" aria-label={label} className={`animate-pulse rounded-md bg-navy-100 ${className}`}>
      <span className="sr-only">{label}…</span>
    </div>
  );
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg border border-dashed border-navy-100 bg-navy-50 px-6 py-12 text-center">
      <p className="text-base font-semibold">{title}</p>
      <p className="mt-1 text-sm text-slate-500">{body}</p>
    </div>
  );
}

export function ErrorState({ title, body, onRetry }: { title: string; body: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="rounded-lg border border-red-500/30 bg-red-50 px-6 py-8 text-center">
      <p className="text-base font-semibold text-red-800">{title}</p>
      <p className="mt-1 text-sm text-red-700">{body}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 rounded-md bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-800 focus-visible:outline-2 focus-visible:outline-red-700"
        >
          Try again
        </button>
      )}
    </div>
  );
}

export function UsageMeter({ used, limit, label }: { used: number; limit: number; label: string }) {
  const pct = limit > 0 ? Math.round((used / limit) * 100) : 0;
  return (
    <div className="rounded-lg border border-navy-100 p-4">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-slate-500">
          {used} / {limit}
        </span>
      </div>
      <Progress value={pct} label={`${label} usage`} />
    </div>
  );
}
