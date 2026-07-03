import { ImageResponse } from "next/og";
import {
  PACKROUTE_MARK_PATH,
  PACKROUTE_MARK_TRANSFORM,
  PACKROUTE_MARK_VIEWBOX,
} from "@/features/brand/packroute-mark-path";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/seo/metadata";

export const alt = `${SITE_NAME} — ${SITE_TAGLINE}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const FOREST = "#1F5A4A";
const INK = "#253238";
const MARK_HEIGHT = 120;
const MARK_WIDTH = Math.round(
  MARK_HEIGHT * (PACKROUTE_MARK_VIEWBOX.width / PACKROUTE_MARK_VIEWBOX.height),
);
const MARK_VIEWBOX = `${PACKROUTE_MARK_VIEWBOX.x} ${PACKROUTE_MARK_VIEWBOX.y} ${PACKROUTE_MARK_VIEWBOX.width} ${PACKROUTE_MARK_VIEWBOX.height}`;

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          padding: "64px 80px",
          background: "linear-gradient(135deg, #f4f8f6 0%, #e8f0eb 50%, #dce8e0 100%)",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 48,
            width: "100%",
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox={MARK_VIEWBOX}
            width={MARK_WIDTH}
            height={MARK_HEIGHT}
          >
            <g transform={PACKROUTE_MARK_TRANSFORM}>
              <path fill={FOREST} d={PACKROUTE_MARK_PATH} />
            </g>
          </svg>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: 20,
              }}
            >
              <span
                style={{
                  fontSize: 52,
                  fontWeight: 700,
                  color: INK,
                  letterSpacing: "-0.03em",
                }}
              >
                {SITE_NAME}
              </span>
            </div>
            <p
              style={{
                fontSize: 36,
                fontWeight: 600,
                color: INK,
                lineHeight: 1.25,
                margin: 0,
                letterSpacing: "-0.02em",
                maxWidth: 780,
              }}
            >
              {SITE_TAGLINE}
            </p>
            <p
              style={{
                fontSize: 22,
                color: FOREST,
                marginTop: 20,
                marginBottom: 0,
                lineHeight: 1.45,
                maxWidth: 720,
              }}
            >
              Pickup routes, driver workflows, and customer SMS for adventure dog
              hiking teams
            </p>
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
