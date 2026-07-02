import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { resolveDrivingEtaMinutes } from "@/lib/google-maps/eta";
import {
  buildArrivedMessage,
  buildDroppedOffMessage,
  buildEnRouteMessage,
  buildPickedUpMessage,
  logNotification,
} from "@/features/notifications/log";
import { logErrorFromException } from "@/lib/logger";
import type { LatLng } from "@/lib/google-maps/eta";

function revalidateDriverPaths() {
  revalidatePath("/today");
  revalidatePath("/tomorrow");
  revalidatePath("/dashboard/hikes/today");
}

async function markHikeCompletedIfDone(hikeId: string) {
  const supabase = await createClient();
  const { data: stops } = await supabase
    .from("stops")
    .select("status")
    .eq("hike_id", hikeId);

  const allDone = (stops ?? []).every(
    (s) =>
      s.status === "picked_up" ||
      s.status === "dropped_off" ||
      s.status === "skipped"
  );

  if (allDone && (stops ?? []).length > 0) {
    await supabase.from("hikes").update({ status: "completed" }).eq("id", hikeId);
  }
}

/** ETA + SMS after En Route — does not block the driver action response. */
export function scheduleEnRouteSideEffects(input: {
  stopId: string;
  hikeId: string;
  dogId: string;
  companyId: string;
  customerId: string;
  dogName: string;
  stopType: "pickup" | "dropoff";
  origin: LatLng | null;
  destination: LatLng | null;
}) {
  after(async () => {
    try {
      const etaMinutes = await resolveDrivingEtaMinutes(
        input.origin,
        input.destination
      );

      if (etaMinutes != null) {
        const supabase = await createClient();
        await supabase
          .from("stops")
          .update({ eta_minutes: etaMinutes })
          .eq("id", input.stopId);
      }

      await logNotification({
        companyId: input.companyId,
        customerId: input.customerId,
        dogId: input.dogId,
        stopId: input.stopId,
        notificationType: "en_route",
        dogName: input.dogName,
        body: (ownerName) =>
          buildEnRouteMessage(
            ownerName,
            input.dogName,
            input.stopType,
            etaMinutes
          ),
      });

      revalidateDriverPaths();
    } catch (error) {
      logErrorFromException("driver", "En route side effects failed", error, {
        companyId: input.companyId,
        context: { stopId: input.stopId },
      });
    }
  });
}

export function scheduleArrivedNotification(input: {
  stopId: string;
  dogId: string;
  companyId: string;
  customerId: string;
  dogName: string;
  stopType: "pickup" | "dropoff";
}) {
  after(async () => {
    try {
      await logNotification({
        companyId: input.companyId,
        customerId: input.customerId,
        dogId: input.dogId,
        stopId: input.stopId,
        notificationType: "arrived",
        dogName: input.dogName,
        body: (ownerName) =>
          buildArrivedMessage(ownerName, input.dogName, input.stopType),
      });
      revalidateDriverPaths();
    } catch (error) {
      logErrorFromException("driver", "Arrived notification failed", error, {
        companyId: input.companyId,
        context: { stopId: input.stopId },
      });
    }
  });
}

export function schedulePickupNotification(input: {
  stopId: string;
  dogId: string;
  companyId: string;
  customerId: string;
  dogName: string;
}) {
  after(async () => {
    try {
      await logNotification({
        companyId: input.companyId,
        customerId: input.customerId,
        dogId: input.dogId,
        stopId: input.stopId,
        notificationType: "picked_up",
        dogName: input.dogName,
        body: buildPickedUpMessage(input.dogName),
      });
      revalidateDriverPaths();
    } catch (error) {
      logErrorFromException("driver", "Pickup notification failed", error, {
        companyId: input.companyId,
        context: { stopId: input.stopId },
      });
    }
  });
}

export function scheduleDropoffSideEffects(input: {
  stopId: string;
  hikeId: string;
  dogId: string;
  companyId: string;
  customerId: string;
  dogName: string;
}) {
  after(async () => {
    try {
      await logNotification({
        companyId: input.companyId,
        customerId: input.customerId,
        dogId: input.dogId,
        stopId: input.stopId,
        notificationType: "dropped_off",
        dogName: input.dogName,
        body: buildDroppedOffMessage(input.dogName),
      });
      await markHikeCompletedIfDone(input.hikeId);
      revalidateDriverPaths();
    } catch (error) {
      logErrorFromException("driver", "Drop-off side effects failed", error, {
        companyId: input.companyId,
        context: { stopId: input.stopId },
      });
    }
  });
}
