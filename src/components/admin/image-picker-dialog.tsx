"use client";

import { ImagePlus, Link2, Loader2, Upload, X } from "lucide-react";
import { useEffect, useId, useRef, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import {
  listAdminMediaAction,
  uploadAdminImageAction,
} from "@/features/media/actions";
import { MAX_PRODUCT_IMAGES } from "@/features/media/constants";
import type { MediaLibraryItem } from "@/features/media/service";
import { cn } from "@/lib/utils";

type Tab = "upload" | "library" | "url";

const SOURCE_LABEL: Record<MediaLibraryItem["source"], string> = {
  upload: "Завантажені",
  product: "Товари",
  catalog: "Каталог",
  banner: "Банери",
  category: "Категорії",
};

export function ImagePickerField({
  value,
  onChange,
  onAdd,
  maxRemaining = 1,
  buttonLabel = "Завантажити картинку",
  showClear = true,
}: {
  /** Current single value (replace mode) or hint for library highlights */
  value?: string;
  onChange?: (url: string) => void;
  /** When set — append mode (gallery). Each pick/upload calls this with new URL(s). */
  onAdd?: (urls: string[]) => void;
  maxRemaining?: number;
  buttonLabel?: string;
  showClear?: boolean;
}) {
  const titleId = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("upload");
  const [items, setItems] = useState<MediaLibraryItem[]>([]);
  const [libraryError, setLibraryError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [urlDraft, setUrlDraft] = useState(value ?? "");
  const [loadingLibrary, setLoadingLibrary] = useState(false);
  const [uploading, startUpload] = useTransition();
  const [dragOver, setDragOver] = useState(false);
  const [slotsLeft, setSlotsLeft] = useState(maxRemaining);

  const isAddMode = Boolean(onAdd);
  const multi = isAddMode && maxRemaining > 1;

  useEffect(() => {
    if (!open) return;
    setSlotsLeft(maxRemaining);
  }, [open, maxRemaining]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setUrlDraft(value ?? "");
    setUploadError(null);
    setLibraryError(null);
    setLoadingLibrary(true);
    void listAdminMediaAction().then((result) => {
      setLoadingLibrary(false);
      if (!result.ok) {
        setLibraryError(result.error);
        return;
      }
      setItems(result.items);
    });
  }, [open, value]);

  function emitUrls(urls: string[]) {
    const unique = [...new Set(urls.map((u) => u.trim()).filter(Boolean))];
    if (!unique.length) return;
    if (onAdd) {
      const batch = unique.slice(0, Math.max(0, slotsLeft));
      if (!batch.length) {
        setUploadError(`Можна додати максимум ${MAX_PRODUCT_IMAGES} фото`);
        return;
      }
      onAdd(batch);
      const next = slotsLeft - batch.length;
      setSlotsLeft(next);
      if (next <= 0) setOpen(false);
      return;
    }
    onChange?.(unique[0]!);
    setOpen(false);
  }

  function handleFiles(fileList: FileList | null) {
    if (!fileList?.length) return;
    const files = Array.from(fileList).slice(0, Math.max(1, slotsLeft));
    setUploadError(null);
    startUpload(async () => {
      const uploaded: string[] = [];
      for (const file of files) {
        const formData = new FormData();
        formData.set("file", file);
        const result = await uploadAdminImageAction(formData);
        if (!result.ok) {
          setUploadError(result.error);
          break;
        }
        uploaded.push(result.url);
      }
      if (uploaded.length) emitUrls(uploaded);
    });
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="secondary"
          disabled={maxRemaining <= 0}
          onClick={() => setOpen(true)}
        >
          <ImagePlus className="size-4" />
          {buttonLabel}
        </Button>
        {showClear && value && onChange && !isAddMode ? (
          <button
            type="button"
            className="text-xs text-muted-foreground underline-offset-2 hover:text-primary hover:underline"
            onClick={() => onChange("")}
          >
            Очистити
          </button>
        ) : null}
      </div>
      {!isAddMode && value ? (
        <p className="truncate text-xs text-muted-foreground" title={value}>
          {value}
        </p>
      ) : null}
      {isAddMode ? (
        <p className="text-xs text-muted-foreground">
          До {MAX_PRODUCT_IMAGES} фото · залишилось слотів: {Math.max(0, maxRemaining)}
        </p>
      ) : !value ? (
        <p className="text-xs text-muted-foreground">
          Файл з компʼютера або з бібліотеки сайту
        </p>
      ) : null}

      {open ? (
        <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
            aria-label="Закрити"
            onClick={() => setOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="relative z-10 flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-[1.75rem] border border-border bg-background shadow-xl sm:rounded-[1.75rem]"
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-5">
              <div>
                <h2 id={titleId} className="text-display text-lg font-semibold sm:text-xl">
                  Зображення товару
                </h2>
                {isAddMode ? (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Можна додати ще {slotsLeft} з {MAX_PRODUCT_IMAGES}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                className="inline-flex size-10 items-center justify-center rounded-full border border-border"
                aria-label="Закрити"
                onClick={() => setOpen(false)}
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="flex gap-1 border-b border-border px-3 pt-2 sm:px-4">
              {(
                [
                  { id: "upload", label: "Нове фото", icon: Upload },
                  { id: "library", label: "З сайту", icon: ImagePlus },
                  { id: "url", label: "Посилання", icon: Link2 },
                ] as const
              ).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-t-xl px-3 py-2.5 text-sm font-semibold transition",
                    tab === item.id
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <item.icon className="size-3.5" />
                  {item.label}
                </button>
              ))}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
              {tab === "upload" ? (
                <div className="space-y-3">
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    multiple={multi}
                    className="sr-only"
                    onChange={(e) => {
                      handleFiles(e.target.files);
                      e.target.value = "";
                    }}
                  />
                  <button
                    type="button"
                    disabled={uploading || slotsLeft <= 0}
                    onClick={() => fileRef.current?.click()}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOver(true);
                    }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragOver(false);
                      handleFiles(e.dataTransfer.files);
                    }}
                    className={cn(
                      "flex w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed px-4 py-12 text-center transition",
                      dragOver
                        ? "border-primary bg-primary/10"
                        : "border-border bg-surface hover:border-primary/50",
                      uploading && "opacity-70",
                    )}
                  >
                    {uploading ? (
                      <Loader2 className="size-8 animate-spin text-primary" />
                    ) : (
                      <Upload className="size-8 text-primary" />
                    )}
                    <p className="text-sm font-semibold">
                      {uploading
                        ? "Завантаження…"
                        : multi
                          ? "Перетягніть файли сюди або натисніть"
                          : "Перетягніть файл сюди або натисніть"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      JPG, PNG, WebP, GIF · до 5 МБ
                      {multi ? ` · до ${slotsLeft} файлів за раз` : ""}
                    </p>
                  </button>
                  {uploadError ? <p className="text-sm text-danger">{uploadError}</p> : null}
                </div>
              ) : null}

              {tab === "library" ? (
                <div className="space-y-3">
                  {isAddMode ? (
                    <p className="text-xs text-muted-foreground">
                      Клік додає фото в галерею. Діалог залишається відкритим, поки є вільні слоти.
                    </p>
                  ) : null}
                  {loadingLibrary ? (
                    <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
                      <Loader2 className="size-5 animate-spin" />
                      Завантаження бібліотеки…
                    </div>
                  ) : libraryError ? (
                    <p className="text-sm text-danger">{libraryError}</p>
                  ) : items.length === 0 ? (
                    <p className="py-12 text-center text-sm text-muted-foreground">
                      Поки немає зображень. Завантажте перше у вкладці «Нове фото».
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {items.map((item) => {
                        const active = value === item.url;
                        return (
                          <button
                            key={item.url}
                            type="button"
                            disabled={slotsLeft <= 0}
                            onClick={() => emitUrls([item.url])}
                            className={cn(
                              "group overflow-hidden rounded-xl border bg-surface text-left transition",
                              active
                                ? "border-primary ring-2 ring-primary/30"
                                : "border-border hover:border-primary/50",
                              slotsLeft <= 0 && "opacity-40",
                            )}
                          >
                            <div className="aspect-square overflow-hidden bg-surface-muted">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={item.url}
                                alt={item.label}
                                className="size-full object-cover transition group-hover:scale-[1.03]"
                              />
                            </div>
                            <div className="space-y-0.5 px-2.5 py-2">
                              <p className="truncate text-xs font-medium">{item.label}</p>
                              <p className="text-[10px] text-muted-foreground">
                                {SOURCE_LABEL[item.source]}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : null}

              {tab === "url" ? (
                <div className="space-y-3">
                  <label className="block space-y-1 text-sm">
                    <span className="text-muted-foreground">URL зображення</span>
                    <input
                      value={urlDraft}
                      onChange={(e) => setUrlDraft(e.target.value)}
                      placeholder="/products/… або https://…"
                      className="h-11 w-full rounded-xl border border-border bg-surface px-3 outline-none focus:border-primary"
                    />
                  </label>
                  <Button
                    type="button"
                    disabled={!urlDraft.trim() || slotsLeft <= 0}
                    onClick={() => {
                      emitUrls([urlDraft.trim()]);
                      setUrlDraft("");
                    }}
                  >
                    {isAddMode ? "Додати" : "Застосувати"}
                  </Button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
