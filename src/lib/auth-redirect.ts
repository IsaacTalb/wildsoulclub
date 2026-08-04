export function getSafeRedirect(search = window.location.search) {
  const redirect = new URLSearchParams(search).get("redirect");
  return redirect?.startsWith("/") && !redirect.startsWith("//") ? redirect : "/";
}

export function getSignInRedirectUrl(redirect = getSafeRedirect()) {
  const url = new URL("/sign-in", window.location.origin);
  if (redirect !== "/") url.searchParams.set("redirect", redirect);
  return url.toString();
}
