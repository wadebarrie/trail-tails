"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { DriverDayView, DriverStopView } from "@/features/driver-actions/queries";
import type { StopStatus } from "@/types";

type DriverDayStateContextValue = {
  mergeStop: (stop: DriverStopView) => DriverStopView;
  mergeDay: (day: DriverDayView) => DriverDayView;
  setStopStatus: (stopId: string, status: StopStatus) => void;
  clearStopStatus: (stopId: string) => void;
};

const DriverDayStateContext = createContext<DriverDayStateContextValue | null>(
  null
);

function applyOverridesToDay(
  day: DriverDayView,
  overrides: Record<string, StopStatus>
): DriverDayView {
  if (Object.keys(overrides).length === 0) return day;

  const mapStop = (stop: DriverStopView) => {
    const status = overrides[stop.id];
    return status ? { ...stop, status } : stop;
  };

  return {
    ...day,
    routes: day.routes.map((route) => ({
      ...route,
      pickups: route.pickups.map(mapStop),
      dropoffs: route.dropoffs.map(mapStop),
    })),
  };
}

export function DriverDayStateProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [overrides, setOverrides] = useState<Record<string, StopStatus>>({});

  const setStopStatus = useCallback((stopId: string, status: StopStatus) => {
    setOverrides((prev) => ({ ...prev, [stopId]: status }));
  }, []);

  const clearStopStatus = useCallback((stopId: string) => {
    setOverrides((prev) => {
      if (!(stopId in prev)) return prev;
      const next = { ...prev };
      delete next[stopId];
      return next;
    });
  }, []);

  const mergeStop = useCallback(
    (stop: DriverStopView) => {
      const status = overrides[stop.id];
      return status ? { ...stop, status } : stop;
    },
    [overrides]
  );

  const mergeDay = useCallback(
    (day: DriverDayView) => applyOverridesToDay(day, overrides),
    [overrides]
  );

  const value = useMemo(
    () => ({ mergeStop, mergeDay, setStopStatus, clearStopStatus }),
    [mergeStop, mergeDay, setStopStatus, clearStopStatus]
  );

  return (
    <DriverDayStateContext.Provider value={value}>
      {children}
    </DriverDayStateContext.Provider>
  );
}

export function useDriverDayState() {
  const ctx = useContext(DriverDayStateContext);
  if (!ctx) {
    throw new Error("useDriverDayState must be used within DriverDayStateProvider");
  }
  return ctx;
}
