import type { LegalDocumentContent } from "@/features/legal/types";
import { LEGAL_PRIVACY_EMAIL } from "@/lib/legal/constants";

export const dataProcessingDocument: LegalDocumentContent = {
  title: "Data Processing Terms",
  description:
    "How PackRoute processes personal information on behalf of dog hiking business customers.",
  sections: [
    {
      heading: "1. Scope",
      blocks: [
        {
          type: "p",
          text: "These Data Processing Terms describe how PackRoute processes personal information on behalf of business customers (“Customers”) when they use the PackRoute platform. They supplement the Terms of Service and Privacy Policy.",
        },
        {
          type: "p",
          text: "When a Customer uploads client, staff, or dog information into PackRoute, the Customer is generally the organization responsible for that information. PackRoute processes it as a service provider to help the Customer operate routes, schedules, notifications, and related workflows.",
        },
      ],
    },
    {
      heading: "2. Nature of processing",
      blocks: [
        {
          type: "p",
          text: "PackRoute provides cloud-based software. Processing activities may include storage, organization, retrieval, transmission, display, logging, backup, and deletion of data submitted by or on behalf of the Customer.",
        },
      ],
    },
    {
      heading: "3. Categories of data",
      blocks: [
        {
          type: "p",
          text: "Depending on how the Customer uses PackRoute, processed data may include:",
        },
        {
          type: "ul",
          items: [
            "Customer staff and driver contact and account information.",
            "End-customer names, phone numbers, email addresses, and addresses.",
            "Dog profile information and schedule-related data.",
            "Route, stop, pickup/drop-off, and notification log data.",
            "Support communications and operational notes entered by the Customer.",
          ],
        },
      ],
    },
    {
      heading: "4. Purposes of processing",
      blocks: [
        {
          type: "p",
          text: "PackRoute processes Customer-submitted data only to provide and improve the service, deliver notifications configured by the Customer, provide support, maintain security, and comply with law — not for unrelated marketing on behalf of PackRoute to the Customer’s end clients unless expressly agreed.",
        },
      ],
    },
    {
      heading: "5. Customer responsibilities",
      blocks: [
        {
          type: "ul",
          items: [
            "Obtain all permissions and consents required to collect and upload personal information.",
            "Ensure data is accurate, lawful, and limited to what is needed for operations.",
            "Configure notifications responsibly and honor opt-out or consent requirements.",
            "Respond to end-customer privacy requests for data the Customer controls.",
            "Not use PackRoute to send unlawful, abusive, or spam communications.",
          ],
        },
      ],
    },
    {
      heading: "6. Subprocessors",
      blocks: [
        {
          type: "p",
          text: "PackRoute may use subprocessors such as cloud hosting, database, messaging, analytics, and payment providers to deliver the service. We require subprocessors to protect personal information and use it only to provide services to us.",
        },
      ],
    },
    {
      heading: "7. Security",
      blocks: [
        {
          type: "p",
          text: "We implement reasonable technical and organizational measures designed to protect processed data. Customers are responsible for securing their account credentials and managing user access within their organization.",
        },
      ],
    },
    {
      heading: "8. Retention and deletion",
      blocks: [
        {
          type: "p",
          text: "We retain Customer-submitted data while the account is active and as needed to provide the service, resolve disputes, or comply with law. Upon termination, we will delete or return Customer data within a reasonable period unless retention is required by law or legitimate business needs.",
        },
      ],
    },
    {
      heading: "9. International transfers",
      blocks: [
        {
          type: "p",
          text: "Customer data may be processed in Canada, the United States, or other countries where we or our subprocessors operate. We take reasonable steps to protect data transferred across borders.",
        },
      ],
    },
    {
      heading: "10. Contact",
      blocks: [
        {
          type: "p",
          text: `Data processing questions: ${LEGAL_PRIVACY_EMAIL}`,
        },
      ],
    },
  ],
};
