import "./globals.css";

export const metadata = {
  title: "PLĀ — Pickleball League of the Americas",
  description: "Youth pickleball program: curriculum, standings, schedules, tournament.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          fontFamily:
            "system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
          background: "#f6f7fb",
        }}
      >
        <div
          style={{
            borderBottom: "4px solid #1E2A38",
            background: "#0f172a",
            color: "white",
          }}
        >
          <div
            style={{
              maxWidth: 1100,
              margin: "0 auto",
              padding: "14px 24px",
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <div style={{ fontWeight: 900, letterSpacing: 1 }}>PLĀ</div>
            <div style={{ opacity: 0.9, fontSize: 13 }}>
              Pilot Season • KHDS Lions • BMA Bulldogs
            </div>
          </div>
        </div>

        {children}
      </body>
    </html>
  );
}
