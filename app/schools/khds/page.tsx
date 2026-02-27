export const dynamic = "force-dynamic";
export const revalidate = 0;

import { supabase } from "@/lib/supabaseClient";
import StandingsTable from "@/components/StandingsTable";
import type { TeamRow } from "@/lib/standings";

type MatchRow = {
  id: number;
  division_id: number;
  team1_id: number;
  team2_id: number;
  score1: number;
  score2: number;
};

function computeStandings(teams: { id: number; name: string }[], matches: MatchRow[]): TeamRow[] {
  const byId = new Map<number, TeamRow>();

  for (const t of teams) {
    byId.set(t.id, {
      id: t.id,
      name: t.name,
      wins: 0,
      losses: 0,
      points_for: 0,
      points_against: 0,
    } as TeamRow);
  }

  for (const m of matches) {
    const t1 = byId.get(m.team1_id);
    const t2 = byId.get(m.team2_id);
    if (!t1 || !t2) continue;

    const s1 = Number(m.score1 ?? 0);
    const s2 = Number(m.score2 ?? 0);

    t1.points_for += s1;
    t1.points_against += s2;

    t2.points_for += s2;
    t2.points_against += s1;

    if (s1 > s2) {
      t1.wins += 1;
      t2.losses += 1;
    } else if (s2 > s1) {
      t2.wins += 1;
      t1.losses += 1;
    }
  }

  const out = Array.from(byId.values());

  out.sort((a, b) => {
    // Wins desc
    if ((b.wins ?? 0) !== (a.wins ?? 0)) return (b.wins ?? 0) - (a.wins ?? 0);

    // Point differential desc
    const aDiff = (a.points_for ?? 0) - (a.points_against ?? 0);
    const bDiff = (b.points_for ?? 0) - (b.points_against ?? 0);
    if (bDiff !== aDiff) return bDiff - aDiff;

    // Points for desc
    if ((b.points_for ?? 0) !== (a.points_for ?? 0)) return (b.points_for ?? 0) - (a.points_for ?? 0);

    // Name asc (stable)
    return (a.name ?? "").localeCompare(b.name ?? "");
  });

  return out;
}

export default async function KHDSPage() {
  const schoolName = "KHDS Lions";

  const { data: school, error: schoolError } = await supabase
    .from("schools")
    .select("id,name")
    .eq("name", schoolName)
    .maybeSingle();

  if (schoolError) {
    return (
      <main style={{ padding: 24, maxWidth: 1100, margin: "0 auto" }}>
        <h1>KHDS Lions</h1>
        <p style={{ color: "crimson" }}>School query error: {schoolError.message}</p>
      </main>
    );
  }

  if (!school?.id) {
    return (
      <main style={{ padding: 24, maxWidth: 1100, margin: "0 auto" }}>
        <h1>KHDS Lions</h1>
        <p style={{ opacity: 0.8 }}>
          Could not find school named <code>{schoolName}</code> in the database.
        </p>
      </main>
    );
  }

  const { data: divisions, error: divisionsError } = await supabase
    .from("divisions")
    .select("id,name")
    .eq("school_id", school.id)
    .order("name", { ascending: true });

  if (divisionsError) {
    return (
      <main style={{ padding: 24, maxWidth: 1100, margin: "0 auto" }}>
        <h1>KHDS Lions</h1>
        <p style={{ color: "crimson" }}>Divisions query error: {divisionsError.message}</p>
      </main>
    );
  }

  const divisionBlocks = await Promise.all(
    (divisions ?? []).map(async (d) => {
      // Teams list
      const { data: teams, error: teamsError } = await supabase
        .from("teams")
        .select("id,name")
        .eq("division_id", d.id)
        .order("name", { ascending: true });

      // Raw league games
      const { data: matches, error: matchesError } = await supabase
        .from("league_matches")
        .select("id,division_id,team1_id,team2_id,score1,score2")
        .eq("division_id", d.id)
        .order("id", { ascending: true });

      const computedTeams =
        teamsError || matchesError
          ? ([] as TeamRow[])
          : computeStandings((teams ?? []) as any, (matches ?? []) as any);

      return {
        divisionId: d.id,
        divisionName: d.name,
        teams: computedTeams,
        teamsError,
        matchesError,
      };
    })
  );

  return (
    <main style={{ padding: 24, maxWidth: 1100, margin: "0 auto" }}>
      <h1 style={{ fontSize: 34, marginBottom: 6 }}>KHDS Lions</h1>
      <p style={{ opacity: 0.8, marginBottom: 18 }}>
        Standings sorted by Wins, then Point Differential (+/-), then Points For.
      </p>

      <div style={{ display: "grid", gap: 18 }}>
        {divisionBlocks.map((block) => (
          <section
            key={block.divisionId}
            style={{
              border: "1px solid rgba(0,0,0,0.12)",
              borderRadius: 14,
              padding: 16,
              background: "white",
            }}
          >
            <h2 style={{ margin: 0, fontSize: 18 }}>Division: {block.divisionName}</h2>

            {block.teamsError ? (
              <p style={{ color: "crimson", marginTop: 10 }}>Teams query error: {block.teamsError.message}</p>
            ) : block.matchesError ? (
              <p style={{ color: "crimson", marginTop: 10 }}>
                League matches query error: {block.matchesError.message}
              </p>
            ) : (
              <div style={{ marginTop: 12 }}>
                <StandingsTable teams={block.teams} />
              </div>
            )}
          </section>
        ))}
      </div>
    </main>
  );
}
