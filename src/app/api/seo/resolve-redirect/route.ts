import { NextResponse } from "next/server";

import { bumpRedirectHit, findActiveRedirect } from "@/features/seo/service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const path = searchParams.get("path");
  if (!path || !path.startsWith("/")) {
    return NextResponse.json({ error: "path required" }, { status: 400 });
  }

  const redirect = await findActiveRedirect(path);
  if (!redirect) {
    return NextResponse.json({ found: false });
  }

  void bumpRedirectHit(redirect.id);

  return NextResponse.json({
    found: true,
    toPath: redirect.toPath,
    statusCode: redirect.statusCode,
  });
}
