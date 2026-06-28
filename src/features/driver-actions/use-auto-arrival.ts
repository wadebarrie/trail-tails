"use client";

import { useEffect, useRef, useState } from "react";
import {
  ARRIVAL_RADIUS_METERS,
  distanceMeters,
  isWithinArrivalRadius,
  travelProgressToArrival,
} from "@/lib/geo";
import { useWakeLock } from "@/features/driver-actions/use-wake-lock";

type LatLng = {
  lat: number;
  lng: number;
};

export type GeoWatchStatus =
  | "idle"
  | "requesting"
  | "watching"
  | "denied"
  | "unavailable";

type UseAutoArrivalOptions = {
  stopId: string;
  enabled: boolean;
  destination: LatLng | null;
  /** Driver position captured when En Route was tapped — anchors progress after refresh. */
  origin: LatLng | null;
  onArrive: () => void;
};

type StoredTravel = {
  initialDistance: number;
  maxProgress: number;
};

const POLL_MS = 4000;
const GEO_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  maximumAge: 0,
  timeout: 20000,
};

function storageKey(stopId: string) {
  return `packroute-travel-${stopId}`;
}

function readStoredTravel(stopId: string): StoredTravel | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(storageKey(stopId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredTravel;
    if (
      typeof parsed.initialDistance === "number" &&
      typeof parsed.maxProgress === "number"
    ) {
      return parsed;
    }
  } catch {
    /* ignore */
  }
  return null;
}

function writeStoredTravel(stopId: string, data: StoredTravel) {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(storageKey(stopId), JSON.stringify(data));
  } catch {
    /* ignore quota / private mode */
  }
}

function clearStoredTravel(stopId: string) {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.removeItem(storageKey(stopId));
  } catch {
    /* ignore */
  }
}

function resolveInitialDistance(
  destination: LatLng,
  origin: LatLng | null,
  stored: StoredTravel | null,
  firstReading: number
): number {
  const candidates = [
    stored?.initialDistance,
    origin
      ? distanceMeters(origin.lat, origin.lng, destination.lat, destination.lng)
      : null,
    firstReading,
  ].filter((v): v is number => v != null && v > 0);

  return Math.max(...candidates);
}

export function useAutoArrival({
  stopId,
  enabled,
  destination,
  origin,
  onArrive,
}: UseAutoArrivalOptions) {
  const onArriveRef = useRef(onArrive);
  const triggeredRef = useRef(false);
  const initialDistanceRef = useRef<number | null>(null);
  const maxProgressRef = useRef(0);

  const [distanceMetersAway, setDistanceMetersAway] = useState<number | null>(
    null
  );
  const [travelProgress, setTravelProgress] = useState<number | null>(null);
  const [locationStatus, setLocationStatus] = useState<GeoWatchStatus>("idle");

  onArriveRef.current = onArrive;

  useWakeLock(enabled);

  useEffect(() => {
    triggeredRef.current = false;
    initialDistanceRef.current = null;
    maxProgressRef.current = 0;
    setDistanceMetersAway(null);
    setTravelProgress(null);
    setLocationStatus("idle");

    if (!enabled || !destination) return;
    if (!navigator.geolocation) {
      setLocationStatus("unavailable");
      return;
    }

    const stored = readStoredTravel(stopId);
    if (stored) {
      initialDistanceRef.current = stored.initialDistance;
      maxProgressRef.current = stored.maxProgress;
      setTravelProgress(stored.maxProgress);
    } else if (origin) {
      initialDistanceRef.current = resolveInitialDistance(
        destination,
        origin,
        null,
        0
      );
    }

    setLocationStatus("requesting");

    function persistProgress(initialDistance: number, maxProgress: number) {
      writeStoredTravel(stopId, { initialDistance, maxProgress });
    }

    function applyPosition(latitude: number, longitude: number) {
      if (triggeredRef.current) return;

      const distance = distanceMeters(
        latitude,
        longitude,
        destination!.lat,
        destination!.lng
      );
      setDistanceMetersAway(distance);
      setLocationStatus("watching");

      if (initialDistanceRef.current == null || initialDistanceRef.current <= 0) {
        initialDistanceRef.current = resolveInitialDistance(
          destination!,
          origin,
          stored,
          distance
        );
      } else {
        initialDistanceRef.current = Math.max(
          initialDistanceRef.current,
          distance
        );
      }

      const progress = travelProgressToArrival(
        distance,
        initialDistanceRef.current
      );
      const maxProgress = Math.max(maxProgressRef.current, progress);
      maxProgressRef.current = maxProgress;
      setTravelProgress(maxProgress);
      persistProgress(initialDistanceRef.current, maxProgress);

      if (
        isWithinArrivalRadius(
          latitude,
          longitude,
          destination!.lat,
          destination!.lng,
          ARRIVAL_RADIUS_METERS
        )
      ) {
        triggeredRef.current = true;
        maxProgressRef.current = 1;
        setTravelProgress(1);
        persistProgress(initialDistanceRef.current, 1);
        clearStoredTravel(stopId);
        onArriveRef.current();
      }
    }

    function handleError(error: GeolocationPositionError) {
      if (error.code === error.PERMISSION_DENIED) {
        setLocationStatus("denied");
        return;
      }
      if (error.code === error.POSITION_UNAVAILABLE) {
        setLocationStatus("unavailable");
      }
      // TIMEOUT — keep last reading; poll + watch will retry
    }

    function requestImmediatePosition() {
      navigator.geolocation.getCurrentPosition(
        (pos) => applyPosition(pos.coords.latitude, pos.coords.longitude),
        handleError,
        { ...GEO_OPTIONS, maximumAge: 0 }
      );
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        requestImmediatePosition();
      }
    }

    function handlePageShow(event: PageTransitionEvent) {
      if (event.persisted) {
        requestImmediatePosition();
      }
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => applyPosition(pos.coords.latitude, pos.coords.longitude),
      handleError,
      GEO_OPTIONS
    );

    const pollId = window.setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        (pos) => applyPosition(pos.coords.latitude, pos.coords.longitude),
        () => {
          /* watch handles errors; poll is best-effort */
        },
        GEO_OPTIONS
      );
    }, POLL_MS);

    requestImmediatePosition();
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pageshow", handlePageShow);

    return () => {
      navigator.geolocation.clearWatch(watchId);
      window.clearInterval(pollId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, [enabled, destination?.lat, destination?.lng, origin?.lat, origin?.lng, stopId]);

  useEffect(() => {
    if (!enabled) {
      clearStoredTravel(stopId);
    }
  }, [enabled, stopId]);

  return {
    canAutoDetect: destination != null,
    distanceMetersAway,
    travelProgress,
    locationStatus,
  };
}
