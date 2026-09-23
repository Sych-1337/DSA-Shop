"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { authClient } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";

export function AdminSignOut() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      disabled={pending}
      className="w-full justify-start text-chrome-foreground/80 hover:bg-white/10 hover:text-primary"
      onClick={() => {
        startTransition(async () => {
          await authClient.signOut();
          router.replace("/admin/login");
          router.refresh();
        });
      }}
    >
      {pending ? "Вихід…" : "Вийти"}
    </Button>
  );
}
