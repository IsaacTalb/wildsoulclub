import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180,
};

export const contentType = "image/png";

export default async function AppleIcon() {
  const helveticaBold = await readFile(
    join(process.cwd(), "public/fonts/helvetica-255/Helvetica-Bold.ttf"),
  );

  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background: "white",
          color: "black",
          display: "flex",
          fontFamily: "Helvetica",
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
      fonts: [
        {
          name: "Helvetica",
          data: helveticaBold,
          style: "normal",
          weight: 700,
        },
      ],
    },
  );
}
