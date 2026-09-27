import { ImageResponse } from "next/og";

const GITHUB_AVATAR_URL = "https://github.com/BLCNYY.png?size=512";

export const size = {
  width: 180,
  height: 180,
};
export const contentType = "image/png";
export const revalidate = 3600;

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "transparent",
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            borderRadius: "999px",
            overflow: "hidden",
          }}
        >
          <img
            alt="BLCNYY GitHub profile picture"
            src={GITHUB_AVATAR_URL}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        </div>
      </div>
    ),
    size,
  );
}
