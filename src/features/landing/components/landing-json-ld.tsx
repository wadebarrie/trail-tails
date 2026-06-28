import { buildHomePageJsonLdScriptProps } from "@/features/landing/seo";

export function LandingJsonLd() {
  return <script {...buildHomePageJsonLdScriptProps()} />;
}
