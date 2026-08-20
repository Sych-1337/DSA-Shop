/** Server Component only — do not import from client components. */
export function JsonLd({
  id,
  data,
}: {
  id: string;
  data: Record<string, unknown> | Record<string, unknown>[];
}) {
  return (
    <script
      id={id}
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
