import { ImageResponse } from "next/og";

export const alt = "BLCNYY — Ömer Balkan";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#000",
          color: "#fff",
          padding: "72px",
          fontFamily:
            'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "22px",
            color: "rgba(255,255,255,0.68)",
            fontSize: 30,
            fontWeight: 600,
            letterSpacing: "-0.04em",
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "999px",
              border: "1px solid rgba(255,255,255,0.25)",
              background: "rgba(255,255,255,0.08)",
              color: "#fff",
            }}
          >
            B
          </div>
          BLCNYY / Ömer Balkan
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "22px",
          }}
        >
          <div
            style={{
              maxWidth: 920,
              fontSize: 96,
              lineHeight: 0.92,
              fontWeight: 800,
              letterSpacing: "-0.08em",
            }}
          >
            Vibe-coder and tech enthusiast from day one.
          </div>
          <div
            style={{
              color: "rgba(255,255,255,0.62)",
              fontSize: 30,
              lineHeight: 1.35,
              maxWidth: 760,
            }}
          >
            Explore my story, projects, and writing — or ask the AI profile
            about anything else.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            color: "rgba(255,255,255,0.44)",
            fontSize: 24,
            letterSpacing: "-0.03em",
          }}
        >
          <span>blcnyy.dev</span>
          <span>Explore / Ask</span>
        </div>
      </div>
    ),
    size,
  );
}
