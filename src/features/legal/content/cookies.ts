import type { LegalDocumentContent } from "@/features/legal/types";
import { LEGAL_PRIVACY_EMAIL } from "@/lib/legal/constants";

export const cookiesDocument: LegalDocumentContent = {
  title: "Cookie Policy",
  description:
    "How PackRoute uses cookies and similar technologies on its website and platform.",
  sections: [
    {
      heading: "1. What are cookies",
      blocks: [
        {
          type: "p",
          text: "Cookies are small text files stored on your device when you visit a website. Similar technologies include local storage, session storage, and pixels. They help websites remember preferences, keep you signed in, and understand how the site is used.",
        },
      ],
    },
    {
      heading: "2. How PackRoute uses cookies",
      blocks: [
        {
          type: "p",
          text: "We use cookies and similar technologies to operate PackRoute, keep accounts secure, remember preferences, and understand product usage so we can improve the service.",
        },
      ],
    },
    {
      heading: "3. Types of cookies we may use",
      blocks: [
        {
          type: "ul",
          items: [
            "Essential cookies — required for authentication, security, and core platform functionality. The service may not work properly without them.",
            "Functional cookies — remember settings and improve usability.",
            "Analytics cookies — help us understand traffic, feature usage, and performance in aggregate.",
          ],
        },
      ],
    },
    {
      heading: "4. Third-party cookies",
      blocks: [
        {
          type: "p",
          text: "Some cookies may be set by service providers we use for hosting, analytics, authentication, or payment processing. Those providers handle information according to their own policies.",
        },
      ],
    },
    {
      heading: "5. Your choices",
      blocks: [
        {
          type: "p",
          text: "Most browsers let you block or delete cookies. Blocking essential cookies may prevent you from signing in or using parts of PackRoute. Where required by law, we will provide additional choices for non-essential cookies.",
        },
      ],
    },
    {
      heading: "6. More information",
      blocks: [
        {
          type: "p",
          text: "For broader information about how we handle personal information, see our Privacy Policy.",
        },
        {
          type: "p",
          text: `Questions: ${LEGAL_PRIVACY_EMAIL}`,
        },
      ],
    },
  ],
};
