import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Career Readiness — AI-powered resume tools";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "flex-end",
          padding: "72px 80px",
          background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 55%, #0f172a 100%)",
          fontFamily: "system-ui, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative glow top-right */}
        <div
          style={{
            position: "absolute",
            top: "-120px",
            right: "-120px",
            width: "640px",
            height: "640px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(79,70,229,0.4) 0%, transparent 68%)",
          }}
        />
        {/* Secondary glow bottom-left */}
        <div
          style={{
            position: "absolute",
            bottom: "-80px",
            left: "40px",
            width: "380px",
            height: "380px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(6,182,212,0.22) 0%, transparent 68%)",
          }}
        />

        {/* AI badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "8px 20px",
            borderRadius: "9999px",
            background: "rgba(79,70,229,0.28)",
            border: "1px solid rgba(99,102,241,0.55)",
            color: "#a5b4fc",
            fontSize: "20px",
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            marginBottom: "32px",
          }}
        >
          AI-Powered Career Tools
        </div>

        {/* Headline */}
        <div
          style={{
            fontSize: "88px",
            fontWeight: 800,
            color: "#ffffff",
            lineHeight: 1.04,
            letterSpacing: "-0.035em",
            marginBottom: "28px",
          }}
        >
          Career Readiness
        </div>

        {/* Sub-tagline */}
        <div
          style={{
            fontSize: "32px",
            color: "#94a3b8",
            fontWeight: 400,
            lineHeight: 1.45,
            maxWidth: "740px",
          }}
        >
          Resume tailoring · JD match analysis · Skill-gap insights · Learning roadmaps
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
