import { type NextRequest } from "next/server";
import { handleAuth } from "@/features/auth/middleware";

export async function middleware(request: NextRequest) {
  return handleAuth(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.webmanifest|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
