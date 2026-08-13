import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180,
};

export const contentType = "image/png";

export default async function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background: "white",
          color: "black",
          display: "flex",
          fontFamily: "Arial, Helvetica, sans-serif",
          fontSize: 52,
          fontWeight: 700,
          height: "100%",
          justifyContent: "center",
          letterSpacing: -4,
          width: "100%",
        }}
      >
        WSC
      </div>
    ),
    {
      ...size,
    },
  );
}