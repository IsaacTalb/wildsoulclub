import { NextResponse } from "next/server";

export function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const signInUrl = new URL("/sign-in", requestUrl.origin);
  const next = requestUrl.searchParams.get("next");

  if (next?.startsWith("/") && !next.startsWith("//") && next !== "/") {
    signInUrl.searchParams.set("redirect", next);
  }

  for (const parameter of ["code", "error", "error_description"] as const) {
    const value = requestUrl.searchParams.get(parameter);
    if (value) signInUrl.searchParams.set(parameter, value);
  }

  // OAuth fragments are not visible to the server, but browsers preserve the
  // fragment across this redirect. The sign-in page completes either flow.
  return NextResponse.redirect(signInUrl);
}
