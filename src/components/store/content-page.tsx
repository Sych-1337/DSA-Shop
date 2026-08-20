import type { InfoPageContent } from "@/content/info-pages";

export function ContentPage({
  title,
  content,
}: {
  title: string;
  content: InfoPageContent;
}) {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:py-12">
      <h1 className="text-display text-3xl font-semibold sm:text-4xl">{title}</h1>
      <p className="mt-3 text-base text-muted-foreground sm:text-lg">{content.lead}</p>

      <div className="mt-10 space-y-10">
        {content.sections.map((section) => (
          <section key={section.heading}>
            <h2 className="text-display text-xl font-semibold sm:text-2xl">{section.heading}</h2>
            <div className="mt-3 space-y-3 leading-relaxed text-foreground/90">
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
            {section.bullets?.length ? (
              <ul className="mt-4 list-disc space-y-2 pl-5 text-foreground/90">
                {section.bullets.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : null}
          </section>
        ))}
      </div>
    </main>
  );
}
