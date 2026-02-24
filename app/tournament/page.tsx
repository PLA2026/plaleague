export const dynamic = "force-dynamic";
export const revalidate = 0;

import { supabase } from "@/lib/supabaseClient";

type TeamRow = { id: number; name: string };

type SeedRow = {
  division_name: string;
  seed: number;
  school: { name: string }[];
  team: { id: number; name: string }[];
};

type MatchRow = {
  id: number;
  division_name: string;
  round: string;
  match_label: string;
  team1_seed: string | null;
  team2_seed: string | null;
  team1_id: number | null;
  team2_id: number | null;
  winner_team_id: number | null;
};

function prettyDivisionName(name: string) {
  if (name === "4-5") return "Grades 4–5";
  if (name === "6-8") return "Grades 6–8";
  return name;
}

function schoolShortFromName(s: string): "KHDS" | "BMA" {
  return s.toLowerCase().includes("khds") ? "KHDS" : "BMA";
}

export default async function TournamentPage() {
  const { data: state } = await supabase
    .from("tournament_state")
    .select("locked,locked_at")
    .eq("id", 1)
    .maybeSingle();

  // Teams map: id -> base name (Team 1..Team 5 for now)
  const { data: teamsData } = await supabase.from("teams").select("id,name");
  const baseTeamNameById = new Map<number, string>(
    ((teamsData ?? []) as TeamRow[]).map((t) => [t.id, t.name])
  );

  // Seeds map: for each division, map team_id -> "KHDS-1" / "BMA-3"
  const { data: seedsData } = await supabase
    .from("tournament_seeds")
    .select("division_name,seed, team:teams(id,name), school:schools(name)");

  const seeds = (seedsData ?? []) as unknown as SeedRow[];

  const seedLabelByTeamIdByDivision = new Map<string, Map<number, string>>();
  for (const row of seeds) {
    const div = row.division_name;
    if (!seedLabelByTeamIdByDivision.has(div)) seedLabelByTeamIdByDivision.set(div, new Map());
    const map = seedLabelByTeamIdByDivision.get(div)!;

    const schoolName = row.school?.[0]?.name ?? "";
    const short = schoolShortFromName(schoolName);
    const teamId = row.team?.[0]?.id;

    if (teamId) {
      map.set(teamId, `${short}-${row.seed}`);
    }
  }

  const { data: matchesData, error: matchesError } = await supabase
    .from("tournament_matches")
    .select(
      "id,division_name,round,match_label,team1_seed,team2_seed,team1_id,team2_id,winner_team_id"
    )
    .order("division_name", { ascending: true });

  if (matchesError) {
    return (
      <main className="pla-page">
        <h1 className="pla-title">End-of-Season Tournament</h1>
        <div className="pla-error">Matches error: {matchesError.message}</div>
      </main>
    );
  }

  const matches = (matchesData ?? []) as unknown as MatchRow[];
  const divisions = Array.from(new Set(matches.map((m) => m.division_name).filter(Boolean)));

  // Helper: show a readable team string for a given team_id in a division
  function displayNameForTeamId(division: string, teamId: number) {
    const seedMap = seedLabelByTeamIdByDivision.get(division);
    const prefix = seedMap?.get(teamId);
    const base = baseTeamNameById.get(teamId) ?? `Team #${teamId}`;
    return prefix ? `${prefix} • ${base}` : base;
  }

  return (
    <main className="pla-page">
      <h1 className="pla-title">End-of-Season Tournament</h1>

      <p className="pla-subtle">
        Bracket status: <strong>{state?.locked ? "Locked ✅" : "Not locked yet"}</strong>
        {state?.locked_at ? ` (locked at ${new Date(state.locked_at).toLocaleString()})` : ""}
      </p>

      {!state?.locked ? (
        <div className="pla-callout">
          Go to <code>/admin</code> → Tournament → <strong>Lock Seeds &amp; Generate Bracket</strong>.
        </div>
      ) : null}

      <div className="pla-stack">
        {divisions.map((div) => (
          <DivisionBracket
            key={div}
            divisionName={div}
            matches={matches.filter((m) => m.division_name === div)}
            displayNameForTeamId={(teamId) => displayNameForTeamId(div, teamId)}
          />
        ))}
      </div>
    </main>
  );
}

function DivisionBracket({
  divisionName,
  matches,
  displayNameForTeamId,
}: {
  divisionName: string;
  matches: MatchRow[];
  displayNameForTeamId: (teamId: number) => string;
}) {
  const playIns = matches.filter((m) => m.round === "Play-In");
  const qfs = matches.filter((m) => m.round === "Quarterfinal");
  const sfs = matches.filter((m) => m.round === "Semifinal");
  const finals = matches.filter((m) => m.round === "Final");
  const guarantee = matches.filter((m) => m.round === "Guarantee");

  function displayTeam(m: MatchRow, side: 1 | 2) {
    const teamId = side === 1 ? m.team1_id : m.team2_id;
    const seedLabel = side === 1 ? m.team1_seed : m.team2_seed;

    // Prefer real team IDs (with KHDS-# / BMA-# prefix)
    if (teamId) return displayNameForTeamId(teamId);

    // Otherwise show seed label placeholders (WIN(QF-1), LOSE(...), TBD)
    return seedLabel ?? "TBD";
  }

  return (
    <section className="pla-card">
      <div className="pla-cardHeader">
        <h2 className="pla-cardTitle">{prettyDivisionName(divisionName)}</h2>
        <p className="pla-subtleSm">Cross-fill bracket + guarantee match</p>
      </div>

      <div className="pla-bracketGrid">
        <Column title="Play-In" subtitle="4 vs 5 (each school)">
          {playIns
            .sort((a, b) => (a.match_label ?? "").localeCompare(b.match_label ?? ""))
            .map((m) => (
              <MatchCard
                key={m.id}
                label={m.match_label}
                a={displayTeam(m, 1)}
                b={displayTeam(m, 2)}
                winnerId={m.winner_team_id}
                team1Id={m.team1_id}
                team2Id={m.team2_id}
              />
            ))}
        </Column>

        <Column title="Quarterfinals" subtitle="Cross-fill">
          {qfs
            .sort((a, b) => (a.match_label ?? "").localeCompare(b.match_label ?? ""))
            .map((m) => (
              <MatchCard
                key={m.id}
                label={m.match_label}
                a={displayTeam(m, 1)}
                b={displayTeam(m, 2)}
                winnerId={m.winner_team_id}
                team1Id={m.team1_id}
                team2Id={m.team2_id}
              />
            ))}
        </Column>

        <Column title="Semifinals" subtitle="Winners advance">
          {sfs
            .sort((a, b) => (a.match_label ?? "").localeCompare(b.match_label ?? ""))
            .map((m) => (
              <MatchCard
                key={m.id}
                label={m.match_label}
                a={displayTeam(m, 1)}
                b={displayTeam(m, 2)}
                winnerId={m.winner_team_id}
                team1Id={m.team1_id}
                team2Id={m.team2_id}
              />
            ))}
        </Column>

        <Column title="Final" subtitle="Championship">
          {finals.map((m) => (
            <MatchCard
              key={m.id}
              label="FINAL"
              a={displayTeam(m, 1)}
              b={displayTeam(m, 2)}
              big
              winnerId={m.winner_team_id}
              team1Id={m.team1_id}
              team2Id={m.team2_id}
            />
          ))}
        </Column>
      </div>

      <div className="pla-guaranteeWrap">
        <h3 className="pla-guaranteeTitle">Guarantee Match (to 15)</h3>
        <p className="pla-subtleSm">
          First-round losers play a one-game consolation so every team gets at least two matches.
        </p>

        <div className="pla-guaranteeRow">
          {guarantee.map((m) => (
            <MatchCard
              key={m.id}
              label={m.match_label}
              a={displayTeam(m, 1)}
              b={displayTeam(m, 2)}
              winnerId={m.winner_team_id}
              team1Id={m.team1_id}
              team2Id={m.team2_id}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function Column({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="pla-col">
      <div className="pla-colHeader">
        <div className="pla-colTitle">{title}</div>
        {subtitle ? <div className="pla-colSub">{subtitle}</div> : null}
      </div>
      <div className="pla-colBody">{children}</div>
    </div>
  );
}

function MatchCard({
  label,
  a,
  b,
  big,
  winnerId,
  team1Id,
  team2Id,
}: {
  label: string;
  a: string;
  b: string;
  big?: boolean;
  winnerId: number | null;
  team1Id: number | null;
  team2Id: number | null;
}) {
  function isWinner(side: 1 | 2) {
    if (!winnerId) return false;
    const tid = side === 1 ? team1Id : team2Id;
    return !!tid && tid === winnerId;
  }

  return (
    <div className={`pla-match ${big ? "pla-matchBig" : ""}`}>
      <div className="pla-matchLabel">{label}</div>

      <div
        className="pla-teamRow"
        style={isWinner(1) ? { outline: "2px solid rgba(34,197,94,0.35)" } : undefined}
      >
        <div className="pla-teamName">
          {a}
          {isWinner(1) ? " ✅" : ""}
        </div>
        <div className="pla-teamScore"></div>
      </div>

      <div
        className="pla-teamRow"
        style={isWinner(2) ? { outline: "2px solid rgba(34,197,94,0.35)" } : undefined}
      >
        <div className="pla-teamName">
          {b}
          {isWinner(2) ? " ✅" : ""}
        </div>
        <div className="pla-teamScore"></div>
      </div>
    </div>
  );
}
