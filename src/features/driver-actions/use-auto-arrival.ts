"use client";

import { useEffect, useRef, useState } from "react";
import {
  ARRIVAL_RADIUS_METERS,
  distanceMeters,
  isWithinArrivalRadius,
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
  const [distanceMetersAway, setDistanceMetersAway] = useState<number | null>(
    null
  );

  onArriveRef.current = onArrive;

  useEffect(() => {
    triggeredRef.current = false;
    setDistanceMetersAway(null);

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
          onArriveRef.current();
        }
      },
      () => setDistanceMetersAway(null),
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 30000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [enabled, destination?.lat, destination?.lng]);

  return {
    canAutoDetect: destination != null,
    distanceMetersAway,
  };
}
