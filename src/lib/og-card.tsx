import { siteConfig } from "@/lib/site";

export const ogImageSize = {
  width: 1200,
  height: 630,
};

type OgCardProps = {
  title: string;
  description?: string;
  footerLeft: string;
  footerRight: string;
};

export function OgCard({
  title,
  description,
  footerLeft,
  footerRight,
}: OgCardProps) {
  const titleSize = title.length > 70 ? 64 : title.length > 40 ? 80 : 96;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background:
          "radial-gradient(circle at 50% 120%, rgba(255, 92, 0, 0.22), transparent 55%), #000",
        color: "#fff",
        padding: "72px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "22px",
          color: "rgba(255,255,255,0.72)",
          fontSize: 30,
          fontWeight: 600,
          letterSpacing: "-0.04em",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt=""
          src={`${siteConfig.avatarUrl}?size=160`}
          width={60}
          height={60}
          style={{
            borderRadius: "999px",
            border: "2px solid rgba(255,154,31,0.7)",
          }}
        />
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
            maxWidth: 1040,
            fontSize: titleSize,
            lineHeight: 0.98,
            fontWeight: 800,
            letterSpacing: "-0.06em",
          }}
        >
          {title}
        </div>
        {description ? (
          <div
            style={{
              color: "rgba(255,255,255,0.62)",
              fontSize: 30,
              lineHeight: 1.35,
              maxWidth: 900,
            }}
          >
            {description}
          </div>
        ) : null}
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          color: "rgba(255,255,255,0.5)",
          fontSize: 24,
          letterSpacing: "-0.03em",
        }}
      >
        <span>{footerLeft}</span>
        <span style={{ color: "#ff9a1f" }}>{footerRight}</span>
      </div>
    </div>
  );
}
