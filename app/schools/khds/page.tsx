export const dynamic = "force-dynamic";
export const revalidate = 0;import { supabase } from "@/lib/supabaseClient";
import StandingsTable from "@/components/StandingsTable";
import type { TeamRow } from "@/lib/standings";

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
      const { data: teams, error: teamsError } = await supabase
        .from("teams")
        .select("id,name,wins,losses,points_for,points_against")
        .eq("division_id", d.id)
        .order("name", { ascending: true });

      return {
        divisionId: d.id,
        divisionName: d.name,
        teams: (teams ?? []) as TeamRow[],
        teamsError,
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
              <p style={{ color: "crimson", marginTop: 10 }}>
                Teams query error: {block.teamsError.message}
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
