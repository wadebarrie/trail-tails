import {
  HOME_H1,
  LANDING_FAQ,
  SITE_CONTACT_EMAIL,
  SITE_DESCRIPTION,
  SITE_NAME,
} from "@/lib/seo/metadata";
import { getSiteUrl } from "@/lib/site-url";

type JsonLd = Record<string, unknown>;

function graph(items: JsonLd[]): string {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@graph": items,
  });
}

export function buildHomePageJsonLd(): string {
  const siteUrl = getSiteUrl();

  const organization: JsonLd = {
    "@type": "Organization",
    "@id": `${siteUrl}/#organization`,
    name: SITE_NAME,
    url: siteUrl,
    logo: {
      "@type": "ImageObject",
      url: `${siteUrl}/icon.png`,
    },
    contactPoint: {
      "@type": "ContactPoint",
      email: SITE_CONTACT_EMAIL,
      contactType: "sales",
      availableLanguage: "English",
    },
  };

  const website: JsonLd = {
    "@type": "WebSite",
    "@id": `${siteUrl}/#website`,
    name: SITE_NAME,
    url: siteUrl,
    description: SITE_DESCRIPTION,
    publisher: { "@id": `${siteUrl}/#organization` },
    inLanguage: "en-US",
  };

  const webPage: JsonLd = {
    "@type": "WebPage",
    "@id": `${siteUrl}/#webpage`,
    url: siteUrl,
    name: HOME_H1,
    description: SITE_DESCRIPTION,
    isPartOf: { "@id": `${siteUrl}/#website` },
    about: { "@id": `${siteUrl}/#software` },
    inLanguage: "en-US",
  };

  const software: JsonLd = {
    "@type": "SoftwareApplication",
    "@id": `${siteUrl}/#software`,
    name: SITE_NAME,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description: SITE_DESCRIPTION,
    url: siteUrl,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      description: "Contact for pricing",
    },
    featureList: [
      "Customer SMS from driver status updates",
      "Driver mobile Today view",
      "Multi-route and multi-driver scheduling",
      "Schedule change requests by text",
      "Billing period CSV export",
    ],
  };

  const faqPage: JsonLd = {
    "@type": "FAQPage",
    "@id": `${siteUrl}/#faq`,
    mainEntity: LANDING_FAQ.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  };

  return graph([organization, website, webPage, software, faqPage]);
}

export function buildHomePageJsonLdScriptProps() {
  return {
    type: "application/ld+json" as const,
    dangerouslySetInnerHTML: { __html: buildHomePageJsonLd() },
  };
}
