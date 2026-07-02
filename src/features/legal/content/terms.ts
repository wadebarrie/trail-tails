import type { LegalDocumentContent } from "@/features/legal/types";
import { LEGAL_PRIVACY_EMAIL } from "@/lib/legal/constants";

export const termsDocument: LegalDocumentContent = {
  title: "Terms of Service",
  description:
    "Terms of Service for PackRoute — operations software for adventure dog hiking businesses in Canada and the United States.",
  sections: [
    {
      heading: "1. Agreement",
      blocks: [
        {
          type: "p",
          text: "These Terms of Service (“Terms”) govern access to and use of PackRoute, a software platform operated from British Columbia, Canada. By creating an account, accessing, or using PackRoute, you agree to these Terms on behalf of yourself and the business you represent.",
        },
        {
          type: "p",
          text: "If you do not agree, do not use the service.",
        },
      ],
    },
    {
      heading: "2. What PackRoute is — and is not",
      blocks: [
        {
          type: "p",
          text: "PackRoute is an operations and communication tool for adventure dog hiking and group dog walking businesses. It helps companies manage pickup routes, schedules, driver workflows, client and dog information, and customer notifications.",
        },
        {
          type: "p",
          text: "PackRoute does not provide dog hiking services, dog care, transportation, emergency monitoring, veterinary advice, or staff supervision. PackRoute is not a substitute for your own business judgment, safety procedures, insurance, or legal compliance.",
        },
      ],
    },
    {
      heading: "3. Beta software",
      blocks: [
        {
          type: "p",
          text: "PackRoute may be offered in beta or early access. Beta features may change, be added, or removed without notice. The service may contain bugs, errors, or interruptions. Data may be modified, delayed, or temporarily unavailable.",
        },
        {
          type: "p",
          text: "Beta access is provided for evaluation and feedback. You use beta software at your own risk and should maintain your own backups and operational fallbacks.",
        },
      ],
    },
    {
      heading: "4. Your responsibilities",
      blocks: [
        {
          type: "p",
          text: "You remain solely responsible for your business operations, including your staff, drivers, hikers, customers, dogs, routes, pickup and drop-off decisions, safety, insurance, licensing, and compliance with applicable laws.",
        },
        {
          type: "ul",
          items: [
            "Routes, ETAs, schedules, notifications, and driver workflows in PackRoute are tools only — not guarantees of timing, safety, or outcomes.",
            "Do not rely on PackRoute for emergencies or urgent pet-care decisions. Call emergency services or your veterinarian when needed.",
            "You are responsible for having permission to send SMS, email, and other customer notifications through PackRoute, including consent and opt-out requirements.",
            "You are responsible for the accuracy, completeness, and legality of data you enter into PackRoute.",
          ],
        },
      ],
    },
    {
      heading: "5. Acceptable use",
      blocks: [
        {
          type: "p",
          text: "You agree not to misuse PackRoute. Prohibited conduct includes:",
        },
        {
          type: "ul",
          items: [
            "Using the service for unlawful purposes or in violation of applicable privacy, telecommunications, or consumer protection laws.",
            "Sending spam, abusive, harassing, or deceptive messages through the platform.",
            "Scraping, reverse engineering, or attempting to bypass security or access controls.",
            "Uploading malicious code or interfering with the service or other users.",
            "Using PackRoute in a way that infringes privacy or intellectual property rights.",
          ],
        },
      ],
    },
    {
      heading: "6. Subscriptions and billing",
      blocks: [
        {
          type: "p",
          text: "Paid plans, if offered, are billed on a recurring monthly subscription basis unless otherwise agreed in writing. Trials or promotional access may be offered at PackRoute’s discretion and may convert to paid plans unless cancelled before the trial ends.",
        },
        {
          type: "ul",
          items: [
            "You authorize PackRoute and its payment processor to charge applicable subscription fees, taxes, and failed-payment retries using your payment method on file.",
            "You may cancel according to the cancellation process in the product or by contacting us. Cancellation stops future billing but does not entitle you to a refund for the current period unless otherwise agreed in writing.",
            "Prices may change with reasonable notice. Continued use after a price change constitutes acceptance of the new price.",
            "Fees are non-refundable except where required by law or expressly agreed in writing.",
          ],
        },
      ],
    },
    {
      heading: "7. Disclaimers",
      blocks: [
        {
          type: "p",
          text: "To the maximum extent permitted by applicable law, PackRoute is provided “as is” and “as available.” We disclaim all warranties, whether express or implied, including implied warranties of merchantability, fitness for a particular purpose, and non-infringement.",
        },
        {
          type: "p",
          text: "We do not warrant that the service will be uninterrupted, error-free, or meet your operational requirements.",
        },
      ],
    },
    {
      heading: "8. Limitation of liability",
      blocks: [
        {
          type: "p",
          text: "To the maximum extent permitted by law, PackRoute and its operators will not be liable for any indirect, incidental, special, consequential, or punitive damages, or for lost profits, lost data, business interruption, or loss of goodwill arising from your use of the service.",
        },
        {
          type: "p",
          text: "To the maximum extent permitted by law, PackRoute’s total liability for any claim arising out of or relating to the service is limited to the greater of (a) CAD $100 or (b) the amounts you paid to PackRoute for the service in the three (3) months before the event giving rise to the claim.",
        },
      ],
    },
    {
      heading: "9. Indemnity",
      blocks: [
        {
          type: "p",
          text: "You agree to defend, indemnify, and hold harmless PackRoute and its operators from claims, damages, losses, and expenses (including reasonable legal fees) arising from:",
        },
        {
          type: "ul",
          items: [
            "Your dog-care or hiking operations, routes, and business decisions.",
            "Customer communications sent through or in connection with PackRoute.",
            "Conduct of your staff, drivers, or contractors.",
            "Data you enter into the platform or your misuse of the service.",
            "Your violation of these Terms or applicable law.",
          ],
        },
      ],
    },
    {
      heading: "10. Changes",
      blocks: [
        {
          type: "p",
          text: "We may update these Terms or the service from time to time. Material changes will be reflected by updating the “Last updated” date. Continued use after changes become effective constitutes acceptance of the revised Terms.",
        },
      ],
    },
    {
      heading: "11. Governing law",
      blocks: [
        {
          type: "p",
          text: "These Terms are governed by the laws of the Province of British Columbia and the federal laws of Canada applicable therein, without regard to conflict-of-law principles. Courts in British Columbia, Canada shall have exclusive jurisdiction, except where prohibited by law.",
        },
      ],
    },
    {
      heading: "12. Contact",
      blocks: [
        {
          type: "p",
          text: `Questions about these Terms: ${LEGAL_PRIVACY_EMAIL}`,
        },
      ],
    },
  ],
};
