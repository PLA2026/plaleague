import Link from "next/link";

import AdminLeagueForm from "@/components/AdminLeagueForm";
import AdminBracketLock from "@/components/AdminBracketLock";
import AdminTournamentForm from "@/components/AdminTournamentForm";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function AdminPage() {
  return (
    <main style={{ padding: 24, maxWidth: 1100, margin: "0 auto" }}>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <h1 style={{ fontSize: 34, marginBottom: 10 }}>Admin</h1>

        <Link
          href="/admin/tournament"
          style={{
            padding: "10px 14px",
            borderRadius: 12,
            border: "1px solid rgba(0,0,0,0.12)",
            background: "white",
            fontWeight: 900,
            textDecoration: "none",
            color: "#0f172a",
          }}
        >
          Tournament Scores →
        </Link>
      </div>

      <p style={{ opacity: 0.8, marginTop: 0, marginBottom: 18 }}>
        League game entry + tournament seeding + bracket generation + tournament match scoring.
      </p>

      <div style={{ display: "grid", gap: 18 }}>
        <AdminLeagueForm />
        <AdminBracketLock />
        <AdminTournamentForm />
      </div>
    </main>
  );
}
