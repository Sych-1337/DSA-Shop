"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import {
  createWishlistAction,
  deleteWishlistAction,
  renameWishlistAction,
  setDefaultWishlistAction,
  setWishlistShareAction,
} from "@/features/wishlist/actions";
import { useRouter } from "@/i18n/navigation";

type ListSummary = {
  id: string;
  name: string;
  isDefault: boolean;
  itemCount: number;
  isPublic: boolean;
  shareToken: string | null;
};

export function WishlistListsManager({
  lists,
  activeList,
}: {
  lists: ListSummary[];
  activeList: ListSummary | null;
}) {
  const t = useTranslations("wishlist");
  const locale = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [shareNote, setShareNote] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [renameValue, setRenameValue] = useState(activeList?.name ?? "");
  const [shareState, setShareState] = useState({
    isPublic: activeList?.isPublic ?? false,
    shareToken: activeList?.shareToken ?? null,
  });

  useEffect(() => {
    setRenameValue(activeList?.name ?? "");
    setShareState({
      isPublic: activeList?.isPublic ?? false,
      shareToken: activeList?.shareToken ?? null,
    });
    setShareNote(null);
  }, [activeList?.id, activeList?.name, activeList?.isPublic, activeList?.shareToken]);

  function shareUrl(token: string) {
    if (typeof window === "undefined") return `/${locale}/wishlist/share/${token}`;
    return `${window.location.origin}/${locale}/wishlist/share/${token}`;
  }

  function goToList(listId: string) {
    router.push(`/wishlist?list=${listId}`);
    router.refresh();
  }

  return (
    <div className="mt-8 space-y-6">
      <section className="rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-card)] sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">{t("yourLists")}</p>
            {lists.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">{t("noListsYet")}</p>
            ) : (
              <ul className="mt-3 flex flex-wrap gap-2">
                {lists.map((list) => (
                  <li key={list.id}>
                    <button
                      type="button"
                      onClick={() => goToList(list.id)}
                      className={
                        list.id === activeList?.id
                          ? "rounded-full bg-primary px-3 py-1.5 text-sm font-medium text-white"
                          : "rounded-full border border-border px-3 py-1.5 text-sm hover:border-primary"
                      }
                    >
                      {list.name}
                      <span className="ml-1 opacity-70">({list.itemCount})</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <form
            className="flex w-full flex-col gap-2 sm:max-w-xs"
            onSubmit={(event) => {
              event.preventDefault();
              setError(null);
              const formData = new FormData();
              formData.set("name", newName);
              startTransition(async () => {
                const result = await createWishlistAction(formData);
                if (!result.ok) {
                  setError(result.error);
                  return;
                }
                setNewName("");
                goToList(result.listId);
              });
            }}
          >
            <label className="text-sm">
              <span className="mb-1.5 block text-muted-foreground">{t("createList")}</span>
              <input
                value={newName}
                onChange={(event) => setNewName(event.target.value)}
                placeholder={t("listNamePlaceholder")}
                maxLength={60}
                className="h-11 w-full rounded-xl border border-border bg-background px-3 outline-none focus:border-primary"
              />
            </label>
            <Button type="submit" variant="secondary" disabled={pending || !newName.trim()}>
              {t("createListCta")}
            </Button>
          </form>
        </div>
        {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
      </section>

      {activeList ? (
        <section className="rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-card)] sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <form
              className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-end"
              onSubmit={(event) => {
                event.preventDefault();
                setError(null);
                const formData = new FormData();
                formData.set("listId", activeList.id);
                formData.set("name", renameValue);
                startTransition(async () => {
                  const result = await renameWishlistAction(formData);
                  if (!result.ok) {
                    setError(result.error);
                    return;
                  }
                  router.refresh();
                });
              }}
            >
              <label className="min-w-0 flex-1 text-sm">
                <span className="mb-1.5 block text-muted-foreground">{t("renameList")}</span>
                <input
                  value={renameValue}
                  onChange={(event) => setRenameValue(event.target.value)}
                  maxLength={60}
                  className="h-11 w-full rounded-xl border border-border bg-background px-3 outline-none focus:border-primary"
                />
              </label>
              <Button type="submit" variant="outline" disabled={pending}>
                {t("saveName")}
              </Button>
            </form>

            <div className="flex flex-wrap gap-2">
              {!activeList.isDefault ? (
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    const formData = new FormData();
                    formData.set("listId", activeList.id);
                    startTransition(async () => {
                      await setDefaultWishlistAction(formData);
                      router.refresh();
                    });
                  }}
                >
                  <Button type="submit" variant="secondary" size="sm" disabled={pending}>
                    {t("makeDefault")}
                  </Button>
                </form>
              ) : (
                <span className="inline-flex h-9 items-center rounded-full bg-primary/10 px-3 text-xs font-medium text-primary">
                  {t("defaultBadge")}
                </span>
              )}
              {lists.length > 1 ? (
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    if (!confirm(t("deleteConfirm"))) return;
                    const formData = new FormData();
                    formData.set("listId", activeList.id);
                    startTransition(async () => {
                      const result = await deleteWishlistAction(formData);
                      if (!result.ok) {
                        setError(result.error ?? t("errorGeneric"));
                        return;
                      }
                      router.push("/wishlist");
                      router.refresh();
                    });
                  }}
                >
                  <Button type="submit" variant="outline" size="sm" disabled={pending}>
                    {t("deleteList")}
                  </Button>
                </form>
              ) : null}
            </div>
          </div>

          <div className="mt-5 border-t border-border pt-4">
            <p className="text-sm font-semibold">{t("shareHeading")}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t("shareHint")}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant={shareState.isPublic ? "secondary" : "outline"}
                size="sm"
                disabled={pending}
                onClick={() => {
                  setError(null);
                  setShareNote(null);
                  const formData = new FormData();
                  formData.set("listId", activeList.id);
                  formData.set("enabled", shareState.isPublic ? "false" : "true");
                  startTransition(async () => {
                    const result = await setWishlistShareAction(formData);
                    if (!result.ok) {
                      setError(result.error ?? t("errorGeneric"));
                      return;
                    }
                    setShareState({
                      isPublic: result.isPublic,
                      shareToken: result.shareToken,
                    });
                    setShareNote(result.isPublic ? t("shareEnabled") : t("shareDisabled"));
                    router.refresh();
                  });
                }}
              >
                {shareState.isPublic ? t("shareDisable") : t("shareEnable")}
              </Button>
              {shareState.isPublic && shareState.shareToken ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    const url = shareUrl(shareState.shareToken!);
                    try {
                      await navigator.clipboard.writeText(url);
                      setShareNote(t("shareCopied"));
                    } catch {
                      setShareNote(url);
                    }
                  }}
                >
                  {t("shareCopy")}
                </Button>
              ) : null}
            </div>
            {shareState.isPublic && shareState.shareToken ? (
              <p className="mt-2 break-all text-xs text-muted-foreground">
                {shareUrl(shareState.shareToken)}
              </p>
            ) : null}
            {shareNote ? <p className="mt-2 text-sm text-muted-foreground">{shareNote}</p> : null}
          </div>
        </section>
      ) : null}
    </div>
  );
}
