import Link from "next/link";

export default function HomePage() {
  return (
    <main style={{ padding: 24, maxWidth: 1100, margin: "0 auto" }}>
      <header style={{ padding: "24px 0" }}>
        <div style={{ fontSize: 14, letterSpacing: 1, opacity: 0.8 }}>
          TRADITIONAL SCHOOL ATHLETIC • PILOT SEASON 2026
        </div>
        <h1 style={{ fontSize: 52, margin: "10px 0 6px", color: "#0f172a" }}>
          PLĀ
        </h1>
        <div style={{ fontSize: 18, opacity: 0.85 }}>
          Pickleball League of the Americas
        </div>
      </header>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
        }}
      >
        <Link href="/schools/khds" style={cardStyle}>
          <div style={cardTitle}>KHDS Lions</div>
          <div style={cardSub}>Standings • Schedule • Results</div>
        </Link>

        <Link href="/schools/bma" style={cardStyle}>
          <div style={cardTitle}>BMA Bulldogs</div>
          <div style={cardSub}>Standings • Schedule • Results</div>
        </Link>

        <Link href="/program" style={cardStyle}>
          <div style={cardTitle}>Program</div>
          <div style={cardSub}>12-week season • Weeks 1–8 curriculum</div>
        </Link>

        <Link href="/tournament" style={cardStyle}>
          <div style={cardTitle}>Tournament</div>
          <div style={cardSub}>Cross-filled bracket • Play-in • Consolation</div>
        </Link>

        <Link href="/merch" style={cardStyle}>
          <div style={cardTitle}>Merch</div>
          <div style={cardSub}>Email to order • Proceeds support growth</div>
        </Link>

        <Link href="/admin" style={cardStyle}>
          <div style={cardTitle}>Admin</div>
          <div style={cardSub}>
            Enter scores • Lock seeds & generate bracket
          </div>
        </Link>
      </section>
    </main>
  );
}

const cardStyle: React.CSSProperties = {
  border: "1px solid rgba(0,0,0,0.15)",
  borderRadius: 14,
  padding: 18,
  textDecoration: "none",
  color: "inherit",
  background: "white",
};

const cardTitle: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 900,
  letterSpacing: 0.5,
};

const cardSub: React.CSSProperties = {
  marginTop: 6,
  opacity: 0.75,
};
