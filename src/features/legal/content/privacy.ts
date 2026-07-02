import type { LegalDocumentContent } from "@/features/legal/types";
import { LEGAL_PRIVACY_EMAIL } from "@/lib/legal/constants";

export const privacyDocument: LegalDocumentContent = {
  title: "Privacy Policy",
  description:
    "How PackRoute collects, uses, and protects personal information for customers in Canada and the United States.",
  sections: [
    {
      heading: "1. Overview",
      blocks: [
        {
          type: "p",
          text: "PackRoute respects your privacy. This Privacy Policy explains how we collect, use, disclose, and protect personal information when you visit our website, contact us, or use our software platform.",
        },
        {
          type: "p",
          text: "PackRoute is based in British Columbia, Canada and serves adventure dog hiking businesses in Canada and the United States. We aim to follow accountable privacy practices consistent with Canadian privacy law, including concepts reflected in BC’s Personal Information Protection Act (PIPA) and the federal Personal Information Protection and Electronic Documents Act (PIPEDA), where applicable.",
        },
      ],
    },
    {
      heading: "2. Who is responsible",
      blocks: [
        {
          type: "p",
          text: "PackRoute is the organization responsible for personal information we collect through our website and platform under this policy.",
        },
        {
          type: "p",
          text: "When a dog hiking company uses PackRoute, that company is generally responsible for personal information it uploads about its customers, staff, and dogs. Our Data Processing terms describe how we handle that information on the company’s behalf.",
        },
      ],
    },
    {
      heading: "3. Information we collect",
      blocks: [
        {
          type: "p",
          text: "Depending on how you interact with PackRoute, we may collect:",
        },
        {
          type: "ul",
          items: [
            "Business contact information (name, company, email, phone).",
            "Account and staff/driver profile information for platform users.",
            "Client/customer contact information entered by our business customers.",
            "Dog profile information entered by our business customers.",
            "Pickup and drop-off addresses, route data, schedules, and stop information.",
            "Notification and message logs related to customer communications.",
            "Billing and subscription information processed by our payment provider.",
            "Support messages and feedback you send us.",
            "Device, browser, and usage data, including IP address and analytics events.",
            "Cookie and similar technology data as described in our Cookie Policy.",
          ],
        },
      ],
    },
    {
      heading: "4. How we use information",
      blocks: [
        {
          type: "p",
          text: "We use personal information to:",
        },
        {
          type: "ul",
          items: [
            "Provide, operate, maintain, and improve PackRoute.",
            "Authenticate users and secure accounts.",
            "Send service-related communications and customer notifications as configured by our business customers.",
            "Process subscriptions and billing.",
            "Respond to demo requests, support inquiries, and product feedback.",
            "Monitor performance, troubleshoot issues, and protect against abuse.",
            "Comply with legal obligations and enforce our terms.",
          ],
        },
      ],
    },
    {
      heading: "5. Consent and accountability",
      blocks: [
        {
          type: "p",
          text: "We collect, use, and disclose personal information for purposes that a reasonable person would consider appropriate in the circumstances. Where required, we rely on consent — for example, when you submit a contact form, create an account, or configure customer notifications.",
        },
        {
          type: "p",
          text: "Business customers are responsible for obtaining any consent required from their own customers, staff, and other individuals whose information they upload to PackRoute.",
        },
      ],
    },
    {
      heading: "6. Disclosure and service providers",
      blocks: [
        {
          type: "p",
          text: "We may share personal information with trusted service providers who help us operate PackRoute, such as hosting, database, email/SMS delivery, analytics, payment processing, and customer support tools. These providers may only use information as needed to perform services for us and must protect it appropriately.",
        },
        {
          type: "p",
          text: "We may also disclose information if required by law, to protect rights and safety, or in connection with a business transaction such as a merger or acquisition.",
        },
      ],
    },
    {
      heading: "7. Cross-border processing",
      blocks: [
        {
          type: "p",
          text: "Personal information may be processed or stored in Canada, the United States, or other countries where our service providers operate. Those countries may have different privacy laws than your jurisdiction. We take reasonable steps to require appropriate safeguards when information is processed outside Canada.",
        },
      ],
    },
    {
      heading: "8. Retention",
      blocks: [
        {
          type: "p",
          text: "We retain personal information only as long as reasonably necessary for the purposes described in this policy, to provide the service, meet legal obligations, resolve disputes, and enforce agreements. Retention periods may vary by data type and customer relationship.",
        },
      ],
    },
    {
      heading: "9. Safeguards",
      blocks: [
        {
          type: "p",
          text: "We use reasonable administrative, technical, and organizational safeguards designed to protect personal information. No method of transmission or storage is completely secure, and we cannot guarantee absolute security.",
        },
      ],
    },
    {
      heading: "10. Access, correction, and deletion",
      blocks: [
        {
          type: "p",
          text: "Depending on your relationship with PackRoute, you may request access to, correction of, or deletion of personal information we hold about you, subject to legal exceptions.",
        },
        {
          type: "p",
          text: "If you are an end customer of a dog hiking company using PackRoute, please contact that company first — they control most operational data about you. We will assist our business customers where appropriate.",
        },
        {
          type: "p",
          text: `Privacy requests: ${LEGAL_PRIVACY_EMAIL}`,
        },
      ],
    },
    {
      heading: "11. U.S. state privacy rights",
      blocks: [
        {
          type: "p",
          text: "Residents of certain U.S. states may have additional privacy rights under applicable state laws, such as rights to know, access, delete, or correct personal information, or to opt out of certain processing. PackRoute does not claim compliance with every U.S. state privacy law.",
        },
        {
          type: "p",
          text: "If you believe you have rights under a U.S. state privacy law, contact us and we will respond in accordance with applicable law.",
        },
      ],
    },
    {
      heading: "12. Cookies",
      blocks: [
        {
          type: "p",
          text: "We use cookies and similar technologies as described in our Cookie Policy.",
        },
      ],
    },
    {
      heading: "13. Contact",
      blocks: [
        {
          type: "p",
          text: `Privacy questions or requests: ${LEGAL_PRIVACY_EMAIL}`,
        },
      ],
    },
  ],
};
