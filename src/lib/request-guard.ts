// Rejects browser requests sent from other sites. Requests without these
// headers (curl, server-to-server) still pass, so this only blocks other
// websites from spending the API budget through visitors' browsers.
export function isCrossSiteRequest(request: Request) {
  const fetchSite = request.headers.get("sec-fetch-site");

  if (fetchSite && fetchSite !== "same-origin" && fetchSite !== "none") {
    return true;
  }

  const origin = request.headers.get("origin");

  if (!origin) {
    return false;
  }

  const host =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host");

  try {
    return new URL(origin).host !== host;
  } catch {
    return true;
  }
}
