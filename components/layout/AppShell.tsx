export function Breadcrumbs({ trail }: { trail: Array<{ label: string; href?: string }> }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-1 text-sm">
        {trail.map((item, i) => (
          <li key={item.label} className="flex items-center gap-1">
            {i > 0 && (
              <span aria-hidden="true" className="text-slate-400">
                /
              </span>
            )}
            {item.href && i < trail.length - 1 ? (
              <a href={item.href} className="text-teal-800 hover:underline focus-visible:outline-2 focus-visible:outline-teal-700">
                {item.label}
              </a>
            ) : (
              <span aria-current={i === trail.length - 1 ? "page" : undefined} className="text-slate-500">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function Header({ title, actions }: { title: string; actions?: React.ReactNode }) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-navy-100 bg-white px-6 py-4">
      <h1 className="font-serif text-2xl">{title}</h1>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  );
}

const workspaceNav = [
  "Overview",
  "Build",
  "Research",
  "Editor",
  "Reviewer",
  "Sources",
  "Versions",
  "Export",
];

export function Sidebar({ active = "Overview" }: { active?: string }) {
  return (
    <nav aria-label="Primary" className="w-60 shrink-0 border-r border-navy-100 bg-navy-950 p-4 text-white">
      <p className="px-2 font-serif text-lg">AssignMe</p>
      <ul className="mt-4 space-y-1">
        {[
          ["Dashboard", "/dashboard"],
          ["My Work", "/my-work"],
          ["Create Workspace", "/workspaces/new"],
          ["Billing", "/billing"],
          ["Support", "/support"],
          ["Settings", "/settings"],
        ].map(([item, href]) => (
          <li key={item}>
            <a
              href={href}
              aria-current={active === item ? "page" : undefined}
              className={`block rounded-md px-3 py-2 text-sm hover:bg-navy-800 focus-visible:outline-2 focus-visible:outline-teal-100 ${active === item ? "bg-navy-800 font-semibold" : ""}`}
            >
              {item}
            </a>
          </li>
        ))}
      </ul>
      <p className="mt-6 px-2 text-xs font-semibold uppercase tracking-wide text-navy-100">Workspace</p>
      <ul className="mt-2 space-y-1">
        {workspaceNav.map((item) => (
          <li key={item}>
            <a
              href="#"
              aria-current={active === item ? "page" : undefined}
              className={`block rounded-md px-3 py-2 text-sm hover:bg-navy-800 focus-visible:outline-2 focus-visible:outline-teal-100 ${active === item ? "bg-navy-800 font-semibold" : ""}`}
            >
              {item}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function AppShell({
  title,
  sidebarActive,
  children,
}: {
  title: string;
  sidebarActive?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <Sidebar active={sidebarActive} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header title={title} />
        <main id="main-content" className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
