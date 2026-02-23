import AdminLeagueForm from "@/components/AdminLeagueForm";
import AdminBracketLock from "@/components/AdminBracketLock";

export default function AdminPage() {
  return (
    <main style={{ padding: 24, maxWidth: 1100, margin: "0 auto" }}>
      <h1 style={{ fontSize: 34, marginBottom: 10 }}>Admin</h1>

      <div style={{ display: "grid", gap: 18 }}>
        <AdminLeagueForm />
        <AdminBracketLock />
      </div>
    </main>
  );
}
import AdminLeagueForm from "@/components/AdminLeagueForm";
import AdminBracketLock from "@/components/AdminBracketLock";
import AdminTournamentForm from "@/components/AdminTournamentForm";

export default function AdminPage() {
  return (
    <main style={{ padding: 24, maxWidth: 1100, margin: "0 auto" }}>
      <h1 style={{ fontSize: 34, marginBottom: 10 }}>Admin</h1>

      <div style={{ display: "grid", gap: 18 }}>
        <AdminLeagueForm />
        <AdminBracketLock />
        <AdminTournamentForm />
      </div>
    </main>
  );
}
