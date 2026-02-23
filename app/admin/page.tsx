import AdminLeagueForm from "@/components/AdminLeagueForm";

export default function AdminPage() {
  return (
    <main style={{ padding: 24, maxWidth: 1100, margin: "0 auto" }}>
      <h1 style={{ fontSize: 34, marginBottom: 10 }}>Admin</h1>
      <p style={{ opacity: 0.8, marginBottom: 18 }}>
        Enter league games (single game to 11, win by 1). No student names are shown publicly.
      </p>

      <AdminLeagueForm />
    </main>
  );
}
