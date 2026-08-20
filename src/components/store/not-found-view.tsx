import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

export type NotFoundCopy = {
  brand: string;
  code: string;
  title: string;
  body: string;
  home: string;
  catalog: string;
  hint: string;
  support: string;
};

export function NotFoundView({ copy, homeHref = "/" }: { copy: NotFoundCopy; homeHref?: string }) {
  return (
    <main className="relative flex min-h-[min(100dvh,900px)] flex-1 flex-col overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-chrome via-[#1a1218] to-chrome" />
      <div className="manga-texture pointer-events-none absolute inset-0 opacity-40" />
      <div className="pointer-events-none absolute -top-24 left-1/2 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-primary/25 blur-3xl" />
      <div className="pointer-events-none absolute right-[-10%] bottom-[-10%] h-72 w-72 rounded-full bg-primary/20 blur-3xl" />

      <span
        className="not-found-float pointer-events-none absolute top-[18%] left-[8%] text-3xl text-primary/80 sm:text-4xl"
        aria-hidden
      >
        ★
      </span>
      <span
        className="not-found-float-delay pointer-events-none absolute top-[28%] right-[12%] text-2xl text-chrome-foreground/35 sm:text-3xl"
        aria-hidden
      >
        ✦
      </span>
      <span
        className="not-found-float-slow pointer-events-none absolute bottom-[22%] left-[14%] text-xl text-primary/50"
        aria-hidden
      >
        ♡
      </span>
      <span
        className="not-found-float-delay pointer-events-none absolute right-[18%] bottom-[30%] text-2xl text-chrome-foreground/25"
        aria-hidden
      >
        ◌
      </span>

      <div className="relative z-10 mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-4 py-20 text-center">
        <p className="text-display text-sm font-semibold tracking-[0.28em] text-primary uppercase sm:text-base">
          {copy.brand}
        </p>

        <div className="relative mt-6">
          <p
            className="text-display not-found-glitch select-none text-[clamp(6.5rem,22vw,11rem)] leading-none font-semibold tracking-tight text-chrome-foreground"
            aria-hidden
          >
            {copy.code}
          </p>
          <p className="sr-only">{copy.code}</p>
        </div>

        <h1 className="text-display mt-6 max-w-xl text-3xl font-semibold text-chrome-foreground sm:text-4xl">
          {copy.title}
        </h1>
        <p className="mt-4 max-w-md text-base text-chrome-foreground/70 sm:text-lg">{copy.body}</p>

        <div className="mt-10 flex w-full max-w-sm flex-col gap-3 sm:max-w-none sm:w-auto sm:flex-row sm:justify-center">
          <Button href={homeHref} size="lg" className="w-full sm:w-auto">
            {copy.home}
          </Button>
          <Button
            href="/catalog"
            size="lg"
            variant="secondary"
            className="w-full border-white/15 bg-white/10 text-chrome-foreground hover:bg-white/15 sm:w-auto"
          >
            {copy.catalog}
          </Button>
        </div>

        <p className="mt-10 text-xs tracking-wide text-chrome-foreground/45">{copy.hint}</p>
        <Link
          href="/contacts"
          className="mt-2 text-sm font-semibold text-primary transition hover:underline"
        >
          {copy.support}
        </Link>
      </div>
    </main>
  );
}
