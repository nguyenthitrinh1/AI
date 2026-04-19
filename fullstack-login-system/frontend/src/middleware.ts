import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Exclude some static files and images
  if (
    pathname.startsWith("/_next") ||
    pathname.includes("/favicon.ico")
  ) {
    return NextResponse.next();
  }

  // NOTE: Simple client-side storage middleware simulation for Next.js
  // Since we use localStorage for the store, we handle actual auth check in the components.
  // Real industrial-scale protection would use httpOnly cookies.
  
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
