export default function OfflinePage() {
  return (
    <main className="mx-auto max-w-md px-6 py-16 text-center">
      <p className="font-serif text-3xl">AssignMe</p>
      <h1 className="mt-2 text-xl font-semibold">You are offline</h1>
      <p className="mt-2 text-sm text-slate-600">
        Your saved work is safe on your device. Reconnect to continue researching,
        drafting, and syncing.
      </p>
      <a
        href="/dashboard"
        className="mt-6 inline-block rounded-md bg-navy-950 px-4 py-2 text-sm font-medium text-white"
      >
        Retry dashboard
      </a>
    </main>
  );
}
