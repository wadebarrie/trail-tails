/** Customer-facing SMS commands — keep in sync with src/features/sms/parser.ts */
export type SmsCommandDoc = {
  examples: string[];
  meaning: string;
  note?: string;
};

export const SMS_OVERVIEW = {
  phone: "Customers text your PackRoute business number (the same number that sends hike reminders).",
  review:
    "Every schedule-change request goes to the office as a pending request. Nothing changes on the route until an admin approves it.",
  help: 'Customers can text HELP any time for a menu of options.',
  ack: 'After a recognized request, they receive: "Got it! We\'ll review your request shortly."',
};

export const SMS_COMMANDS: SmsCommandDoc[] = [
  {
    examples: ["SKIP TOMORROW", "NO HIKE TOMORROW", "SKIP NEXT HIKE"],
    meaning: "Skip the next scheduled pickup (usually tomorrow).",
  },
  {
    examples: ["SKIP MONDAY", "SKIP FRIDAY"],
    meaning: "Skip the next occurrence of that weekday.",
  },
  {
    examples: ["SKIP NEXT WEEK", "NO HIKES NEXT WEEK"],
    meaning: "Skip the next Mon–Fri block (office confirms exact dates).",
  },
  {
    examples: ["SKIP 7/10", "SKIP JULY 10"],
    meaning: "Skip a specific date.",
  },
  {
    examples: [
      "GOING ON VACATION UNTIL JULY 18",
      "VACATION JULY 10-18",
      "AWAY JULY 10 TO JULY 18",
    ],
    meaning: "Block out a vacation range. “Until” starts from today; ranges use start and end dates.",
  },
  {
    examples: ["PAUSE", "TAKE A BREAK", "STOP HIKES"],
    meaning: "Pause service until the office sets a resume date.",
  },
  {
    examples: ["RESUME", "BACK ON", "START AGAIN"],
    meaning: "Ask to resume after a pause.",
  },
  {
    examples: ["HELP", "help please", "?"],
    meaning: "Receive the full command menu by text.",
  },
];

export const CUSTOMER_EXPLAINER = `PackRoute texts you the night before a hike (around 6 PM) with your pickup window. When the driver is on the way, you'll get an ETA text. You can reply to change your schedule — text HELP for options. The office reviews every change before it takes effect, so you're never accidentally skipped.`;
