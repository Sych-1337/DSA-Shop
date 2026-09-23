"use client";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-lg py-16 text-center">
      <h1 className="text-display text-2xl font-semibold">Помилка адмінки</h1>
      <p className="mt-2 text-sm text-muted-foreground">{error.message || "Невідома помилка"}</p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-white"
      >
        Спробувати знову
      </button>
    </div>
  );
}
