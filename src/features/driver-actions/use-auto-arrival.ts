"use client";

import { useEffect, useRef, useState } from "react";
import {
  ARRIVAL_RADIUS_METERS,
  distanceMeters,
  isWithinArrivalRadius,
  travelProgressToArrival,
} from "@/lib/geo";

type Destination = {
  lat: number;
  lng: number;
};

type UseAutoArrivalOptions = {
  enabled: boolean;
  destination: Destination | null;
  onArrive: () => void;
};

export function useAutoArrival({
  enabled,
  destination,
  onArrive,
}: UseAutoArrivalOptions) {
  const onArriveRef = useRef(onArrive);
  const triggeredRef = useRef(false);
  const initialDistanceRef = useRef<number | null>(null);
  const [distanceMetersAway, setDistanceMetersAway] = useState<number | null>(
    null
  );
  const [travelProgress, setTravelProgress] = useState<number | null>(null);

  onArriveRef.current = onArrive;

  useEffect(() => {
    triggeredRef.current = false;
    initialDistanceRef.current = null;
    setDistanceMetersAway(null);
    setTravelProgress(null);

    if (!enabled || !destination) return;
    if (!navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        if (triggeredRef.current) return;

        const { latitude, longitude } = pos.coords;
        const distance = distanceMeters(
          latitude,
          longitude,
          destination.lat,
          destination.lng
        );
        setDistanceMetersAway(distance);

        if (initialDistanceRef.current === null) {
          initialDistanceRef.current = distance;
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
        setTravelProgress((prev) =>
          prev == null ? progress : Math.max(prev, progress)
        );

        if (
          isWithinArrivalRadius(
            latitude,
            longitude,
            destination.lat,
            destination.lng,
            ARRIVAL_RADIUS_METERS
          )
        ) {
          triggeredRef.current = true;
          setTravelProgress(1);
          onArriveRef.current();
        }
      },
      () => {
        setDistanceMetersAway(null);
        setTravelProgress(null);
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 30000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [enabled, destination?.lat, destination?.lng]);

  return {
    canAutoDetect: destination != null,
    distanceMetersAway,
    travelProgress,
  };
}
