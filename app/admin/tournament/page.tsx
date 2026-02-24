import AdminTournamentForm from "@/components/AdminTournamentForm";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function AdminTournamentPage() {
  return (
    <main style={{ padding: 24, maxWidth: 1100, margin: "0 auto" }}>
      <h1 style={{ fontSize: 34, marginBottom: 10 }}>Admin — Tournament Scores</h1>
      <p style={{ opacity: 0.8, marginTop: 0, marginBottom: 18 }}>
        Enter Best 2-of-3 match scores (to 11, win by 1). Saving will compute winners and advance the bracket.
      </p>

      <AdminTournamentForm />

      <div style={{ marginTop: 18, opacity: 0.8, fontSize: 13 }}>
        After saving a match, refresh <code>/tournament</code> to see teams advance.
      </div>
    </main>
  );
}
