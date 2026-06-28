/** Customer-facing SMS commands — keep in sync with src/features/sms/parser.ts */
export type SmsCommandDoc = {
  examples: string[];
  meaning: string;
  note?: string;
};

export const SMS_OVERVIEW = {
  phone:
    "Customers text your PackRoute business number (the same number that sends hike updates).",
  outbound:
    "Automated outbound texts: night-before pickup reminder (~6 PM local), ETA when the driver taps En Route, and pickup/drop-off confirmations. Schedule-change replies are separate — see below.",
  reminders:
    "Night-before reminders are optional per customer. They can text STOP REMINDERS to opt out or START REMINDERS to opt back in — takes effect immediately with a confirmation text. ETA and pickup/drop-off texts still send when they are on the schedule.",
  review:
    "Schedule-change requests (skip, vacation, pause, etc.) go to the office as a pending request. Nothing changes on the route until an admin approves.",
  help: "Customers can text HELP any time for a menu of options.",
  ack: 'After a recognized schedule request, they receive: "Got it! We\'ll review your request shortly."',
  reminderAck:
    "STOP REMINDERS and START REMINDERS do not create pending requests — the reply is instant.",
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
    examples: ["STOP REMINDERS", "NO REMINDERS", "REMINDERS OFF"],
    meaning:
      "Turn off night-before reminder texts (~6 PM). ETA and pickup/drop-off texts still send.",
    note: "Takes effect immediately — no office review.",
  },
  {
    examples: ["START REMINDERS", "REMINDERS ON"],
    meaning: "Turn night-before reminder texts back on.",
    note: "Takes effect immediately — no office review.",
  },
  {
    examples: ["HELP", "help please", "?"],
    meaning: "Receive the full command menu by text.",
  },
];

export const CUSTOMER_EXPLAINER = `PackRoute can text you the night before a hike (around 6 PM) with your pickup window — reply STOP REMINDERS to opt out, or START REMINDERS to turn them back on. When the driver is on the way, you'll get an ETA text. You can reply to change your schedule — text HELP for options. The office reviews every change before it takes effect, so you're never accidentally skipped.`;
