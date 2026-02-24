import { supabase } from "@/lib/supabaseClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type TeamRow = { id: number; name: string };

type SeedAny = any;

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

function isExplicitSeedLabel(s?: string | null) {
  return !!s && /^(KHDS|BMA)-\d+$/.test(s);
}

function schoolShortFromSchoolName(s: string): "KHDS" | "BMA" {
  return s.toLowerCase().includes("khds") ? "KHDS" : "BMA";
}

export default async function TournamentPage() {
  const { data: state } = await supabase
    .from("tournament_state")
    .select("locked,locked_at")
    .eq("id", 1)
    .maybeSingle();

  // Teams map (id -> "Team 1" etc. for now)
  const { data: teamsData } = await supabase.from("teams").select("id,name");
  const baseTeamNameById = new Map<number, string>(
    ((teamsData ?? []) as TeamRow[]).map((t) => [t.id, t.name])
  );

  /**
   * Build: division -> team_id -> seedLabel (e.g., KHDS-1)
   *
   * We fetch tournament_seeds in a way that works whether joins return arrays or objects.
   */
  const { data: seedsData } = await supabase
    .from("tournament_seeds")
    .select("division_name,seed,team_id,school_id, team:teams(id,name), school:schools(name)");

  const seedLabelByTeamIdByDivision = new Map<string, Map<number, string>>();

  for (const row of (seedsData ?? []) as SeedAny[]) {
    const div: string | undefined = row.division_name;
    if (!div) continue;

    // Robustly extract teamId (works for raw team_id OR joined team object/array)
    const teamId: number | undefined =
      (typeof row.team_id === "number" ? row.team_id : undefined) ??
      (typeof row.team?.id === "number" ? row.team.id : undefined) ??
      (typeof row.team?.[0]?.id === "number" ? row.team[0].id : undefined);

    if (!teamId) continue;

    // Robustly extract school name from join
    const schoolName: string =
      (typeof row.school?.name === "string" ? row.school.name : "") ||
      (typeof row.school?.[0]?.name === "string" ? row.school[0].name : "") ||
      "";

    // If we can’t read school name, we still can’t build KHDS/BMA prefix reliably
    if (!schoolName) continue;

    const short = schoolShortFromSchoolName(schoolName);
    const seedNum: number | undefined = typeof row.seed === "number" ? row.seed : undefined;
    if (!seedNum) continue;

    if (!seedLabelByTeamIdByDivision.has(div)) seedLabelByTeamIdByDivision.set(div, new Map());
    seedLabelByTeamIdByDivision.get(div)!.set(teamId, `${short}-${seedNum}`);
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

  // Given a teamId, return "KHDS-1 • Team 1" (or just "Team 1" if seed is unknown)
  function displayTeamId(division: string, teamId: number, fallbackSeed?: string | null) {
    const base = baseTeamNameById.get(teamId) ?? `Team #${teamId}`;
    const seedMap = seedLabelByTeamIdByDivision.get(division);

    // Prefer explicit seed label if present in match seeds (KHDS-# / BMA-#)
    const explicit = isExplicitSeedLabel(fallbackSeed) ? fallbackSeed! : null;

    const seedLabel = explicit || seedMap?.get(teamId) || null;
    return seedLabel ? `${seedLabel} • ${base}` : base;
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
            displayTeamId={(teamId: number, fallbackSeed?: string | null) =>
              displayTeamId(div, teamId, fallbackSeed)
            }
          />
        ))}
      </div>
    </main>
  );
}

function DivisionBracket({
  divisionName,
  matches,
  displayTeamId,
}: {
  divisionName: string;
  matches: MatchRow[];
  displayTeamId: (teamId: number, fallbackSeed?: string | null) => string;
}) {
  const playIns = matches.filter((m) => m.round === "Play-In");
  const qfs = matches.filter((m) => m.round === "Quarterfinal");
  const sfs = matches.filter((m) => m.round === "Semifinal");
  const finals = matches.filter((m) => m.round === "Final");
  const guarantee = matches.filter((m) => m.round === "Guarantee");

  function displayTeam(m: MatchRow, side: 1 | 2) {
    const teamId = side === 1 ? m.team1_id : m.team2_id;
    const seedLabel = side === 1 ? m.team1_seed : m.team2_seed;

    if (teamId) return displayTeamId(teamId, seedLabel);
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
