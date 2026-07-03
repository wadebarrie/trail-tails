import {
  ADVENTURE_DOG_HIKING_SOFTWARE_DESCRIPTION,
  ADVENTURE_DOG_HIKING_SOFTWARE_TITLE,
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
      availability: "https://schema.org/InStock",
      url: `${siteUrl}/contact`,
      description: "Contact for pricing and demo",
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
  return buildSeoLandingPageJsonLd(
    `${siteUrl}/dog-walking-software`,
    DOG_WALKING_SOFTWARE_TITLE,
    DOG_WALKING_SOFTWARE_DESCRIPTION,
    "-software",
  );
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

function buildOrganization(siteUrl: string): JsonLd {
  return {
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
}

function buildSeoLandingPageJsonLd(
  pageUrl: string,
  title: string,
  description: string,
  faqIdSuffix: string,
): string {
  const siteUrl = getSiteUrl();

  const webPage: JsonLd = {
    "@type": "WebPage",
    "@id": `${pageUrl}/#webpage`,
    url: pageUrl,
    name: title,
    description,
    isPartOf: { "@id": `${siteUrl}/#website` },
    about: { "@id": `${siteUrl}/#software` },
    inLanguage: "en-US",
  };

  return graph([
    buildOrganization(siteUrl),
    buildSoftwareApplication(siteUrl),
    webPage,
    buildFaqPage(pageUrl, faqIdSuffix),
  ]);
}

export function buildAdventureDogHikingSoftwarePageJsonLd(): string {
  const siteUrl = getSiteUrl();
  return buildSeoLandingPageJsonLd(
    `${siteUrl}/adventure-dog-hiking-software`,
    ADVENTURE_DOG_HIKING_SOFTWARE_TITLE,
    ADVENTURE_DOG_HIKING_SOFTWARE_DESCRIPTION,
    "-adventure",
  );
}

export function buildAdventureDogHikingSoftwareJsonLdScriptProps() {
  return {
    type: "application/ld+json" as const,
    dangerouslySetInnerHTML: {
      __html: buildAdventureDogHikingSoftwarePageJsonLd(),
    },
  };
}

export function buildContactPageJsonLd(): string {
  const siteUrl = getSiteUrl();
  const pageUrl = `${siteUrl}/contact`;

  const webPage: JsonLd = {
    "@type": "ContactPage",
    "@id": `${pageUrl}/#webpage`,
    url: pageUrl,
    name: `Contact — ${SITE_NAME}`,
    description:
      "Book a demo or ask about PackRoute — dog walking route planning software for adventure dog hiking teams.",
    isPartOf: { "@id": `${siteUrl}/#website` },
    inLanguage: "en-US",
  };

  return graph([buildOrganization(siteUrl), webPage]);
}

export function buildContactPageJsonLdScriptProps() {
  return {
    type: "application/ld+json" as const,
    dangerouslySetInnerHTML: { __html: buildContactPageJsonLd() },
  };
}
