import { supabase } from "@/lib/supabaseClient";
import StandingsTable from "@/components/StandingsTable";
import type { TeamRow } from "@/lib/standings";

export default async function BMAPage() {
  const { data: school } = await supabase
    .from("schools")
    .select("id")
    .eq("name", "BMA Bulldogs")
    .single();

  const { data: divisions } = await supabase
    .from("divisions")
    .select("id,name")
    .eq("school_id", school?.id);

  const divisionBlocks = await Promise.all(
    (divisions ?? []).map(async (d) => {
      const { data: teams } = await supabase
        .from("teams")
        .select("id,name,wins,losses,points_for,points_against")
        .eq("division_id", d.id);

      return {
        divisionName: d.name,
        teams: (teams ?? []) as TeamRow[]
      };
    })
  );

  return (
    <main style={{ padding: 24, maxWidth: 1100, margin: "0 auto" }}>
      <h1>BMA Bulldogs</h1>

      {divisionBlocks.map((block) => (
        <section key={block.divisionName} style={{ marginTop: 20 }}>
          <h2>Division: {block.divisionName}</h2>
          <StandingsTable teams={block.teams} />
        </section>
      ))}
    </main>
  );
}
