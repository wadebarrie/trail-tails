import { Card, PageHeader } from "@/features/admin/components/ui";
import { requireRole } from "@/features/auth/queries";
import {
  buildDroppedOffMessage,
  buildEnRouteMessage,
  buildNightBeforeMessage,
  buildPickedUpMessage,
} from "@/features/notifications/log";

const SAMPLES = [
  {
    title: "Night-before reminder",
    when: "The evening before a pickup, at the time in Settings (default 7:30 p.m.).",
    body: buildNightBeforeMessage(
      "Alex Chen",
      ["Cooper"],
      "08:05:00",
      "08:35:00",
      ["Sam"]
    ),
  },
  {
    title: "On the way",
    when: "When the driver taps En route. Not when they open Today.",
    body: buildEnRouteMessage("Alex Chen", "Cooper", "pickup", 12),
  },
  {
    title: "Picked up",
    when: "When the driver taps Picked up.",
    body: buildPickedUpMessage("Cooper"),
  },
  {
    title: "Dropped off",
    when: "When the driver taps Dropped off.",
    body: buildDroppedOffMessage("Cooper"),
  },
] as const;

export default async function MessagePreviewPage() {
  await requireRole("admin");

  return (
    <div>
      <PageHeader
        title="Customer text preview"
        description="Sample wording customers receive. Names, times, and dogs are filled in from the real stop when the text sends. This page is a preview — it does not send anything."
      />
      <div className="space-y-4">
        {SAMPLES.map((sample) => (
          <Card key={sample.title}>
            <h2 className="text-base font-semibold text-stone-900">{sample.title}</h2>
            <p className="mt-1 text-sm text-stone-500">{sample.when}</p>
            <p className="mt-3 rounded-lg bg-stone-50 px-3 py-3 text-sm text-stone-800">
              {sample.body}
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}
