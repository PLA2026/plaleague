export const dynamic = "force-dynamic";
export const revalidate = 0;

import { supabase } from "@/lib/supabaseClient";

export default async function TournamentPage() {
  const { data: lockedRow } = await supabase
    .from("tournament_state")
    .select("locked,locked_at")
    .eq("id", 1)
    .maybeSingle();

  const { data: matches } = await supabase
    .from("tournament_matches")
    .select("division_name,round,match_label,team1_seed,team2_seed,score1,score2,winner_team_id")
    .order("division_name", { ascending: true });

  return (
    <main style={{ padding: 24, maxWidth: 1100, margin: "0 auto" }}>
      <h1 style={{ fontSize: 34, marginBottom: 10 }}>End-of-Season Tournament</h1>

      <p style={{ opacity: 0.8 }}>
        Bracket status:{" "}
        <strong>{lockedRow?.locked ? "Locked" : "Not locked yet"}</strong>
        {lockedRow?.locked_at ? ` (locked at ${new Date(lockedRow.locked_at).toLocaleString()})` : ""}
      </p>

      <pre style={{ background: "white", padding: 12, borderRadius: 12, border: "1px solid rgba(0,0,0,0.12)" }}>
        {JSON.stringify(matches ?? [], null, 2)}
      </pre>

      <p style={{ opacity: 0.7, marginTop: 12 }}>
        Next step: replace this JSON with a full visual bracket.
      </p>
    </main>
  );
}
