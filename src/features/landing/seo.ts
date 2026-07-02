import {
  DOG_WALKING_SOFTWARE_DESCRIPTION,
  DOG_WALKING_SOFTWARE_TITLE,
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

function buildSoftwareApplication(siteUrl: string): JsonLd {
  return {
    "@type": "SoftwareApplication",
    "@id": `${siteUrl}/#software`,
    name: SITE_NAME,
    alternateName: [
      "Dog walking software",
      "Dog walking route planner",
      "Adventure dog hiking software",
    ],
    applicationCategory: "BusinessApplication",
    applicationSubCategory: "Dog walking management software",
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
      "Dog walking route planning and pickup order",
      "Group hike and pack walk scheduling",
      "Multi-driver route assignment",
      "Driver mobile Today view",
      "Customer SMS from driver status updates",
      "Schedule change requests by text",
      "Billing period CSV export",
    ],
  };
}

function buildFaqPage(siteUrl: string, idSuffix = ""): JsonLd {
  return {
    "@type": "FAQPage",
    "@id": `${siteUrl}/#faq${idSuffix}`,
    mainEntity: LANDING_FAQ.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  };
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

  return graph([
    organization,
    website,
    webPage,
    buildSoftwareApplication(siteUrl),
    buildFaqPage(siteUrl),
  ]);
}

export function buildDogWalkingSoftwarePageJsonLd(): string {
  const siteUrl = getSiteUrl();
  const pageUrl = `${siteUrl}/dog-walking-software`;

  const webPage: JsonLd = {
    "@type": "WebPage",
    "@id": `${pageUrl}/#webpage`,
    url: pageUrl,
    name: DOG_WALKING_SOFTWARE_TITLE,
    description: DOG_WALKING_SOFTWARE_DESCRIPTION,
    isPartOf: { "@id": `${siteUrl}/#website` },
    about: { "@id": `${siteUrl}/#software` },
    inLanguage: "en-US",
  };

  return graph([
    {
      "@type": "Organization",
      "@id": `${siteUrl}/#organization`,
      name: SITE_NAME,
      url: siteUrl,
    },
    buildSoftwareApplication(siteUrl),
    webPage,
    buildFaqPage(pageUrl, "-software"),
  ]);
}

export function buildHomePageJsonLdScriptProps() {
  return {
    type: "application/ld+json" as const,
    dangerouslySetInnerHTML: { __html: buildHomePageJsonLd() },
  };
}

export function buildDogWalkingSoftwareJsonLdScriptProps() {
  return {
    type: "application/ld+json" as const,
    dangerouslySetInnerHTML: { __html: buildDogWalkingSoftwarePageJsonLd() },
  };
}
