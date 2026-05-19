import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Routes that REQUIRE a signed-in user. Anything else is browseable as a guest.
// Use exact strings or "/path/*" wildcards.
const PROTECTED_PATTERNS: RegExp[] = [
  /^\/chat(\/.*)?$/,
  /^\/notifications(\/.*)?$/,
  /^\/match(\/.*)?$/,
  /^\/admin(\/.*)?$/,
  /^\/profile\/edit$/,
  /^\/hangouts\/new$/,
  /^\/trips\/create$/,
];

const AUTH_ROUTES = ["/login", "/signup"];

function isProtected(path: string) {
  return PROTECTED_PATTERNS.some((re) => re.test(path));
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  // 1) Guest hitting a protected route → push to /login (with redirect-back)
  if (!user && isProtected(path)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  // 2) Already-signed-in user hitting /login or /signup → home
  if (user && AUTH_ROUTES.includes(path)) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  // 3) Signed in but not onboarded → onboarding (unless already there or in auth flow)
  if (user && path !== "/onboarding" && !AUTH_ROUTES.includes(path) && path !== "/auth/callback") {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_onboarded")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile || !profile.is_onboarded) {
      // Only force the onboarding redirect when the user is trying to access
      // something that needs a real profile (protected route) or the home dashboard.
      if (isProtected(path) || path === "/") {
        const url = request.nextUrl.clone();
        url.pathname = "/onboarding";
        return NextResponse.redirect(url);
      }
    }
  }

  // 4) Onboarded user landing on /onboarding → home
  if (user && path === "/onboarding") {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_onboarded")
      .eq("id", user.id)
      .maybeSingle();
    if (profile?.is_onboarded) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
  }

  return response;
}
