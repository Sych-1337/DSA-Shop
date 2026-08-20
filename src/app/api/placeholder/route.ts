import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const title =
    request.nextUrl.searchParams.get("title") ??
    request.nextUrl.searchParams.get("label") ??
    "D&A";
  const hue = Number(request.nextUrl.searchParams.get("hue") ?? "320");
  const safeHue = Number.isFinite(hue) ? Math.max(0, Math.min(360, hue)) : 320;
  const label = title.slice(0, 42).replace(/[<>&]/g, "");

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800" role="img">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="hsl(${safeHue} 85% 72%)"/>
      <stop offset="100%" stop-color="hsl(${(safeHue + 40) % 360} 70% 48%)"/>
    </linearGradient>
  </defs>
  <rect width="800" height="800" fill="url(#g)"/>
  <circle cx="640" cy="160" r="70" fill="rgba(255,255,255,0.25)"/>
  <circle cx="150" cy="620" r="110" fill="rgba(0,0,0,0.12)"/>
  <text x="50%" y="48%" text-anchor="middle" fill="white" font-family="Nunito,Segoe UI,sans-serif" font-size="42" font-weight="700">${label}</text>
  <text x="50%" y="56%" text-anchor="middle" fill="rgba(255,255,255,0.85)" font-family="Nunito,Segoe UI,sans-serif" font-size="22">Dreams &amp; Anime</text>
</svg>`;

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
