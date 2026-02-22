import { supabase } from "@/lib/supabaseClient";
import StandingsTable from "@/components/StandingsTable";
import type { TeamRow } from "@/lib/standings";

export default async function KHDSPage() {
  const schoolName = "KHDS Lions";

  const { data: school, error: schoolError } = await supabase
    .from("schools")
    .select("id,name")
    .eq("name", schoolName)
    .maybeSingle();

  const schoolId = school?.id ?? null;

  const { data: divisions, error: divisionsError } = schoolId
    ? await supabase
        .from("divisions")
        .select("id,name")
        .eq("school_id", schoolId)
        .order("name", { ascending: true })
    : { data: null, error: null };

  const divisionBlocks =
    divisions && divisions.length
      ? await Promise.all(
          divisions.map(async (d) => {
            const { data: teams, error: teamsError } = await supabase
              .from("teams")
              .select("id,name,wins,losses,points_for,points_against")
              .eq("division_id", d.id)
              .order("name", { ascending: true });

            return {
              divisionName: d.name,
              divisionId: d.id,
              teams: (teams ?? []) as TeamRow[],
              teamsError,
            };
          })
        )
      : [];

  return (
    <main style={{ padding: 24, maxWidth: 1100, margin: "0 auto" }}>
      <h1 style={{ fontSize: 34, marginBottom: 6 }}>KHDS Lions</h1>

      {/* DEBUG BLOCK (temporary, but super helpful) */}
      <section
        style={{
          background: "white",
          border: "1px solid rgba(0,0,0,0.12)",
          borderRadius: 12,
          padding: 14,
          margin: "14px 0 22px",
          fontSize: 13,
          opacity: 0.9,
        }}
      >
        <div><strong>Debug</strong></div>
        <div>schoolName query: <code>{schoolName}</code></div>
        <div>school found: <code>{school ? "YES" : "NO"}</code></div>
        <div>schoolId: <code>{schoolId ?? "null"}</code></div>
        <div>schoolError: <code>{schoolError?.message ?? "none"}</code></div>
        <div>divisions count: <code>{divisions?.length ?? 0}</code></div>
        <div>divisionsError: <code>{divisionsError?.message ?? "none"}</code></div>
      </section>

      {divisionBlocks.length === 0 ? (
        <p style={{ opacity: 0.8 }}>
          No divisions found for this school yet. (See Debug box above.)
        </p>
      ) : (
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
              <h2 style={{ margin: 0, fontSize: 18 }}>
                Division: {block.divisionName}
              </h2>
              {block.teamsError ? (
                <p style={{ color: "crimson" }}>
                  Teams error: {block.teamsError.message}
                </p>
              ) : (
                <div style={{ marginTop: 12 }}>
                  <StandingsTable teams={block.teams} />
                </div>
              )}
            </section>
          ))}
        </div>
      )}
    </main>
  );
}
