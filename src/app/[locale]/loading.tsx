export default function StoreLoading() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <div className="h-8 w-48 animate-pulse rounded bg-surface-muted" />
      <div className="mt-4 h-4 w-full animate-pulse rounded bg-surface-muted" />
      <div className="mt-2 h-4 w-2/3 animate-pulse rounded bg-surface-muted" />
    </div>
  );
}
