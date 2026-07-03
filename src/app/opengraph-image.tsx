import { ImageResponse } from "next/og";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/seo/metadata";

export const alt = `${SITE_NAME} — ${SITE_TAGLINE}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "72px 80px",
          background: "linear-gradient(145deg, #f4f8f6 0%, #e4ede7 55%, #d4e4da 100%)",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            marginBottom: 36,
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: "#1F5A4A",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg
              width="32"
              height="32"
              viewBox="0 0 32 32"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M8 22c2-6 6-10 8-14 2 4 6 8 8 14"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="16" cy="10" r="2.5" fill="white" />
            </svg>
          </div>
          <span
            style={{
              fontSize: 44,
              fontWeight: 700,
              color: "#253238",
              letterSpacing: "-0.02em",
            }}
          >
            {SITE_NAME}
          </span>
        </div>
        <p
          style={{
            fontSize: 40,
            fontWeight: 600,
            color: "#253238",
            lineHeight: 1.25,
            maxWidth: 900,
            margin: 0,
            letterSpacing: "-0.02em",
          }}
        >
          {SITE_TAGLINE}
        </p>
        <p
          style={{
            fontSize: 24,
            color: "#1F5A4A",
            marginTop: 28,
            maxWidth: 820,
            lineHeight: 1.45,
          }}
        >
          Pickup routes, driver workflows, and customer SMS for adventure dog
          hiking teams
        </p>
      </div>
    ),
    { ...size },
  );
}
