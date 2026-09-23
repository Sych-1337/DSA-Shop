"use client";

export default function StoreError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto max-w-lg px-4 py-16 text-center">
      <h1 className="text-display text-2xl font-semibold">Щось пішло не так</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Спробуйте ще раз. Якщо помилка повторюється — напишіть нам у контакти.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-white"
      >
        Спробувати знову
      </button>
      {error.digest ? (
        <p className="mt-4 text-xs text-muted-foreground">Код: {error.digest}</p>
      ) : null}
    </main>
  );
}
