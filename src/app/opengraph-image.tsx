import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "JoinAdda — Meet, Travel, Hangout";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "flex-start",
          padding: "80px",
          background:
            "linear-gradient(135deg, #FFF8F2 0%, #FFE4D2 50%, #FEA619 100%)",
        }}
      >
        <div
          style={{
            fontSize: 84,
            fontWeight: 800,
            color: "#FF6B2B",
            letterSpacing: "-0.04em",
            marginBottom: 24,
          }}
        >
          joinadda
        </div>
        <div
          style={{
            fontSize: 56,
            fontWeight: 700,
            color: "#1A1A1A",
            letterSpacing: "-0.02em",
            lineHeight: 1.1,
            marginBottom: 32,
          }}
        >
          Meet. Travel. Hangout.
        </div>
        <div
          style={{
            fontSize: 32,
            color: "#4A4A4A",
            maxWidth: 900,
            lineHeight: 1.3,
          }}
        >
          A community for working professionals in Indian cities to find their
          people — weekend trips, hangouts, and good company.
        </div>
      </div>
    ),
    { ...size },
  );
}
