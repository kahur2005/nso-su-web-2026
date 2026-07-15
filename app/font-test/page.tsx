import { Pixelify_Sans } from "next/font/google";

const pixelify = Pixelify_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-pixelify",
});

const SAMPLE = "NSO Showcase 2026 — The Quick Brown Fox";
const HEADLINE = "HELLO WORLD";

export default function FontTestPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0a0a0f",
        color: "#e0e0e0",
        padding: "48px 32px",
        fontFamily: "sans-serif",
      }}
    >
      <h1 style={{ color: "#888", fontSize: 13, letterSpacing: 4, marginBottom: 48, textTransform: "uppercase" }}>
        Font Showcase — Quick Test
      </h1>

      {/* ── VCR OSD Mono ── */}
      <section style={{ marginBottom: 64 }}>
        <p style={{ fontSize: 11, color: "#555", letterSpacing: 2, marginBottom: 16, textTransform: "uppercase" }}>
          VCR OSD Mono
        </p>
        <style>{`
          @font-face {
            font-family: 'VCR';
            src: url('/fonts/VCR.ttf') format('truetype');
            font-weight: normal;
          }
        `}</style>

        <div style={{ fontFamily: "'VCR', monospace", marginBottom: 12 }}>
          <span style={{ fontSize: 48, display: "block", color: "#fff" }}>{HEADLINE}</span>
          <span style={{ fontSize: 24, display: "block", color: "#ccc", marginTop: 8 }}>{SAMPLE}</span>
          <span style={{ fontSize: 14, display: "block", color: "#888", marginTop: 8 }}>
            abcdefghijklmnopqrstuvwxyz 0123456789 !@#$%
          </span>
        </div>
      </section>

      {/* ── Pixelify Sans ── */}
      <section className={pixelify.variable} style={{ marginBottom: 64 }}>
        <p style={{ fontSize: 11, color: "#555", letterSpacing: 2, marginBottom: 16, textTransform: "uppercase" }}>
          Pixelify Sans
        </p>

        {(
          [
            { weight: "400", label: "Regular 400" },
            { weight: "600", label: "SemiBold 600" },
            { weight: "700", label: "Bold 700" },
          ] as const
        ).map(({ weight, label }) => (
          <div key={weight} style={{ marginBottom: 24 }}>
            <p style={{ fontSize: 10, color: "#444", marginBottom: 6 }}>{label}</p>
            <span
              style={{
                fontFamily: "var(--font-pixelify)",
                fontWeight: weight,
                fontSize: 40,
                display: "block",
                color: "#fff",
                lineHeight: 1.1,
              }}
            >
              {HEADLINE}
            </span>
            <span
              style={{
                fontFamily: "var(--font-pixelify)",
                fontWeight: weight,
                fontSize: 20,
                display: "block",
                color: "#aaa",
                marginTop: 4,
              }}
            >
              {SAMPLE}
            </span>
            <span
              style={{
                fontFamily: "var(--font-pixelify)",
                fontWeight: weight,
                fontSize: 14,
                display: "block",
                color: "#666",
                marginTop: 4,
              }}
            >
              abcdefghijklmnopqrstuvwxyz 0123456789 !@#$%
            </span>
          </div>
        ))}
      </section>

      {/* ── Side-by-side comparison ── */}
      <section>
        <p style={{ fontSize: 11, color: "#555", letterSpacing: 2, marginBottom: 16, textTransform: "uppercase" }}>
          Side-by-side at 32px
        </p>
        <div style={{ display: "flex", gap: 32, flexWrap: "wrap" }}>
          {[
            { label: "VCR", font: "'VCR', monospace", weight: "normal" },
            { label: "Pixelify 400", font: "var(--font-pixelify)", weight: "400" },
            { label: "Pixelify 600", font: "var(--font-pixelify)", weight: "600" },
            { label: "Pixelify 700", font: "var(--font-pixelify)", weight: "700" },
          ].map(({ label, font, weight }) => (
            <div
              key={label}
              style={{
                background: "#111",
                border: "1px solid #222",
                borderRadius: 8,
                padding: "20px 24px",
                minWidth: 220,
              }}
            >
              <p style={{ fontSize: 10, color: "#555", marginBottom: 10 }}>{label}</p>
              <p
                className={pixelify.variable}
                style={{ fontFamily: font, fontSize: 32, fontWeight: weight, color: "#fff", margin: 0 }}
              >
                NSO 2026
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
