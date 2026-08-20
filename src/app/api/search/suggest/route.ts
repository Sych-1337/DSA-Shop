import { NextResponse } from "next/server";

import { listSearchSuggestions } from "@/features/catalog/service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) {
    return NextResponse.json({ items: [] as const });
  }

  const items = await listSearchSuggestions(q, 6);
  return NextResponse.json({ items });
}
