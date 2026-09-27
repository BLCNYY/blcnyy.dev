import { ImageResponse } from "next/og";

const GITHUB_AVATAR_URL = "https://github.com/BLCNYY.png?size=256";

export const size = {
  width: 64,
  height: 64,
};
export const contentType = "image/png";
export const revalidate = 3600;

export default function Icon() {
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
