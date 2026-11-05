import { type NextRequest, NextResponse } from "next/server";

import {
  LOCALE_COOKIE,
  getPreferredLocale,
  isLocale,
  localizePath,
} from "@/lib/i18n";

// Sends visitors whose browser (system) language is Turkish from an English
// page to its Turkish twin under /tr. A language picked from the menu or the
// terminal is stored in a cookie and always wins, so choosing English sticks.
export function proxy(request: NextRequest) {
  // Only full page loads. Client-side navigations, prefetches, and bots that
  // don't send Sec-Fetch-Dest are left alone, so in-app links never bounce.
  if (request.headers.get("sec-fetch-dest") !== "document") {
    return NextResponse.next();
  }

  const chosen = request.cookies.get(LOCALE_COOKIE)?.value;
  const locale = isLocale(chosen)
    ? chosen
    : getPreferredLocale(request.headers.get("accept-language"));

  if (locale !== "tr") {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = localizePath("tr", request.nextUrl.pathname);

  return NextResponse.redirect(url);
}

// English pages that have a Turkish version.
export const config = {
  matcher: ["/", "/ask", "/blog", "/blog/:slug"],
};
