import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  AUTH_STARTED_COOKIE,
  authStartedCookieOptions,
  getAuthSessionMaxMs,
} from "@/lib/auth/session-timeout";

const PROTECTED_PREFIXES = ["/dashboard", "/onboarding"];

type CookieToSet = {
  name: string;
  value: string;
  options?: Parameters<NextResponse["cookies"]["set"]>[2];
};

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  let pendingCookies: CookieToSet[] = [];

  // Read directly in middleware (Edge). Missing values must not throw —
  // that surfaces as Vercel MIDDLEWARE_INVOCATION_FAILED (500).
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";

  if (!url || !anonKey || url.includes("your-") || anonKey.includes("your-")) {
    console.error(
      "[middleware] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. Set them in Vercel → Project Settings → Environment Variables (Production + Preview)."
    );

    const isProtected = PROTECTED_PREFIXES.some((prefix) =>
      request.nextUrl.pathname.startsWith(prefix)
    );
    if (isProtected) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/login";
      return NextResponse.redirect(loginUrl);
    }
    return response;
  }

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        pendingCookies = cookiesToSet;
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  // Refreshes the session cookie on every request — required for SSR auth to stay in sync.
  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch (err) {
    console.error("[middleware] supabase.auth.getUser failed:", err);
  }

  const maxMs = getAuthSessionMaxMs();
  const cookieOpts = authStartedCookieOptions();

  const applyPendingCookies = (res: NextResponse) => {
    pendingCookies.forEach(({ name, value, options }) =>
      res.cookies.set(name, value, options)
    );
  };

  if (user) {
    const startedRaw = request.cookies.get(AUTH_STARTED_COOKIE)?.value;
    const startedAt = startedRaw ? Number(startedRaw) : NaN;

    if (!Number.isFinite(startedAt)) {
      // First authenticated request in this login window.
      response.cookies.set(AUTH_STARTED_COOKIE, String(Date.now()), cookieOpts);
    } else if (Date.now() - startedAt > maxMs) {
      await supabase.auth.signOut();

      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/login";
      loginUrl.searchParams.set("expired", "1");
      const redirect = NextResponse.redirect(loginUrl);
      applyPendingCookies(redirect);
      redirect.cookies.set(AUTH_STARTED_COOKIE, "", { ...cookieOpts, maxAge: 0 });
      return redirect;
    }
  } else if (request.cookies.has(AUTH_STARTED_COOKIE)) {
    response.cookies.set(AUTH_STARTED_COOKIE, "", { ...cookieOpts, maxAge: 0 });
  }

  const isProtected = PROTECTED_PREFIXES.some((prefix) =>
    request.nextUrl.pathname.startsWith(prefix)
  );

  if (isProtected && !user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    const redirect = NextResponse.redirect(loginUrl);
    applyPendingCookies(redirect);
    return redirect;
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
