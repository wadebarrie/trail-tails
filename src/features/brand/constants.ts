import { PACKROUTE_MARK_VIEWBOX } from "@/features/brand/packroute-mark-path";

export type PackRouteMarkSize = "sm" | "md" | "lg";

export const PACKROUTE_MARK_HEIGHT: Record<PackRouteMarkSize, number> = {
  sm: 28,
  md: 32,
  lg: 40,
};

export const PACKROUTE_MARK_ASPECT =
  PACKROUTE_MARK_VIEWBOX.width / PACKROUTE_MARK_VIEWBOX.height;
