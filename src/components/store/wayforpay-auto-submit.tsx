"use client";

import { useEffect, useRef } from "react";

export function WayForPayAutoSubmitForm({
  action,
  fields,
}: {
  action: string;
  fields: Array<[string, string]>;
}) {
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    ref.current?.submit();
  }, []);

  return (
    <main className="mx-auto max-w-md px-4 py-16 text-center">
      <p className="text-sm text-muted-foreground">Перенаправлення на WayForPay…</p>
      <form ref={ref} method="POST" action={action} className="hidden">
        {fields.map(([name, value]) => (
          <input key={name} type="hidden" name={name} value={value} />
        ))}
      </form>
    </main>
  );
}
