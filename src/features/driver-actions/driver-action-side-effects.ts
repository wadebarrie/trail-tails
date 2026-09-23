import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/service";
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

const ETA_BUDGET_MS = 2500;

function revalidateDriverPaths() {
  revalidatePath("/today");
  revalidatePath("/tomorrow");
  revalidatePath("/dashboard/hikes/today");
}

async function resolveEtaWithBudget(
  origin: LatLng | null,
  destination: LatLng | null
): Promise<number | null> {
  try {
    return await Promise.race([
      resolveDrivingEtaMinutes(origin, destination),
      new Promise<null>((resolve) => {
        setTimeout(() => resolve(null), ETA_BUDGET_MS);
      }),
    ]);
  } catch {
    return null;
  }
}

async function markHikeCompletedIfDone(hikeId: string) {
  const supabase = createServiceClient();
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

/**
 * ETA + SMS after En Route.
 * SMS is awaited in-request (Netlify can drop `after()` work); slow ETA compute is budgeted.
 */
export async function scheduleEnRouteSideEffects(input: {
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
  try {
    const etaMinutes = await resolveEtaWithBudget(input.origin, input.destination);

    if (etaMinutes != null) {
      const supabase = createServiceClient();
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
}

export async function scheduleArrivedNotification(input: {
  stopId: string;
  dogId: string;
  companyId: string;
  customerId: string;
  dogName: string;
  stopType: "pickup" | "dropoff";
}) {
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
}

export async function schedulePickupNotification(input: {
  stopId: string;
  dogId: string;
  companyId: string;
  customerId: string;
  dogName: string;
}) {
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
}

export async function scheduleDropoffSideEffects(input: {
  stopId: string;
  hikeId: string;
  dogId: string;
  companyId: string;
  customerId: string;
  dogName: string;
}) {
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
}
