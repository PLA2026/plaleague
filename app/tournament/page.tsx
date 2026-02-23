export const dynamic = "force-dynamic";
export const revalidate = 0;

import type { ReactNode } from "react";
import { supabase } from "@/lib/supabaseClient";

type SeedRow = {
  division_name: string;
  seed: number;
  school: { name: string }[]; // <-- array
  team: { id: number; name: string }[]; // <-- array
};

type MatchRow = {
  division_name: string;
  round: string;
  match_label: string;
  team1_seed: string | null;
  team2_seed: string | null;
  team1_id: number | null;
  team2_id: number | null;
  score1: number | null;
  score2: number | null;
  winner_team_id: number | null;
};

function keyForSeed(schoolShort: "KHDS" | "BMA", seed: number) {
  return `${schoolShort}-${seed}`;
}

function prettyDivisionName(name: string) {
  if (name === "4-5") return "Grades 4–5";
  if (name === "6-8") return "Grades 6–8";
  return name;
}

export default async function TournamentPage() {
  const { data: state } = await supabase
    .from("tournament_state")
    .select("locked,locked_at")
    .eq("id", 1)
    .maybeSingle();

  // Pull seeds with joins (team + school)
  const { data: seedsData, error: seedsError } = await supabase
    .from("tournament_seeds")
    .select("division_name,seed, team:teams(id,name), school:schools(name)");

  // Pull matches
  const { data: matchesData, error: matchesError } = await supabase
    .from("tournament_matches")
    .select(
      "division_name,round,match_label,team1_seed,team2_seed,team1_id,team2_id,score1,score2,winner_team_id"
    )
    .order("division_name", { ascending: true });

  if (seedsError || matchesError) {
    return (
      <main className="page">
        <h1 className="title">End-of-Season Tournament</h1>
        <p className="subtle">
          Bracket status: <strong>{state?.locked ? "Locked" : "Not locked"}</strong>
        </p>
        <div className="error">
          <div><strong>Data error</strong></div>
          {seedsError ? <div>Seeds: {seedsError.message}</div> : null}
          {matchesError ? <div>Matches: {matchesError.message}</div> : null}
        </div>
      </main>
    );
  }

  const seeds = (seedsData ?? []) as SeedRow[];
  const matches = (matchesData ?? []) as MatchRow[];

  // Build seed label -> team name map per division
  // Example key: "KHDS-1" => "Team 3"
  const seedNameByDivision = new Map<string, Map<string, string>>();
  for (const row of seeds) {
    const div = row.division_name;
    if (!seedNameByDivision.has(div)) seedNameByDivision.set(div, new Map());
    const map = seedNameByDivision.get(div)!;

    const schoolName = row.school?.[0]?.name ?? "";

const key = keyForSeed(schoolShort as "KHDS" | "BMA", row.seed);
map.set(key, row.team?.[0]?.name ?? `Seed ${row.seed}`);

  const divisions = Array.from(
    new Set(matches.map((m) => m.division_name).filter(Boolean))
  );

  return (
    <main className="page">
      <h1 className="title">End-of-Season Tournament</h1>
      <p className="subtle">
        Bracket status:{" "}
        <strong>{state?.locked ? "Locked ✅" : "Not locked yet"}</strong>
        {state?.locked_at
          ? ` (locked at ${new Date(state.locked_at).toLocaleString()})`
          : ""}
      </p>

      {!state?.locked ? (
        <div className="callout">
          Go to <code>/admin</code> → Tournament → <strong>Lock Seeds &amp; Generate Bracket</strong>.
        </div>
      ) : null}

      <div className="stack">
        {divisions.map((div) => (
          <DivisionBracket
            key={div}
            divisionName={div}
            matches={matches.filter((m) => m.division_name === div)}
            seedNameMap={seedNameByDivision.get(div) ?? new Map()}
          />
        ))}
      </div>

      <style>{css}</style>
    </main>
  );
}

function DivisionBracket({
  divisionName,
  matches,
  seedNameMap,
}: {
  divisionName: string;
  matches: MatchRow[];
  seedNameMap: Map<string, string>;
}) {
  const playIns = matches.filter((m) => m.round === "Play-In");
  const qfs = matches.filter((m) => m.round === "Quarterfinal");
  const sfs = matches.filter((m) => m.round === "Semifinal");
  const finals = matches.filter((m) => m.round === "Final");
  const guarantee = matches.filter((m) => m.round === "Guarantee");

  function displayTeam(seedLabel: string | null) {
    if (!seedLabel) return "TBD";
    // If it’s a seed like KHDS-1, map to team name
    if (seedNameMap.has(seedLabel)) return seedNameMap.get(seedLabel)!;
    // Otherwise keep placeholder like WIN(PI-BMA)
    return seedLabel;
  }

  return (
    <section className="card">
      <div className="cardHeader">
        <h2 className="cardTitle">{prettyDivisionName(divisionName)}</h2>
        <p className="subtleSm">Cross-fill bracket (KHDS vs BMA) + guarantee match</p>
      </div>

      <div className="bracketGrid">
        <Column title="Play-In" subtitle="4 vs 5 (each school)">
          {playIns
            .sort((a, b) => (a.match_label ?? "").localeCompare(b.match_label ?? ""))
            .map((m) => (
              <MatchCard
                key={`${m.round}-${m.match_label}`}
                label={m.match_label}
                a={displayTeam(m.team1_seed)}
                b={displayTeam(m.team2_seed)}
                scoreA={m.score1}
                scoreB={m.score2}
              />
            ))}
        </Column>

        <Column title="Quarterfinals" subtitle="Cross-fill">
          {qfs
            .sort((a, b) => (a.match_label ?? "").localeCompare(b.match_label ?? ""))
            .map((m) => (
              <MatchCard
                key={`${m.round}-${m.match_label}`}
                label={m.match_label}
                a={displayTeam(m.team1_seed)}
                b={displayTeam(m.team2_seed)}
                scoreA={m.score1}
                scoreB={m.score2}
              />
            ))}
        </Column>

        <Column title="Semifinals" subtitle="Winners advance">
          {sfs
            .sort((a, b) => (a.match_label ?? "").localeCompare(b.match_label ?? ""))
            .map((m) => (
              <MatchCard
                key={`${m.round}-${m.match_label}`}
                label={m.match_label}
                a={displayTeam(m.team1_seed)}
                b={displayTeam(m.team2_seed)}
                scoreA={m.score1}
                scoreB={m.score2}
              />
            ))}
        </Column>

        <Column title="Final" subtitle="Championship">
          {finals.map((m) => (
            <MatchCard
              key={`${m.round}-${m.match_label}`}
              label="FINAL"
              a={displayTeam(m.team1_seed)}
              b={displayTeam(m.team2_seed)}
              scoreA={m.score1}
              scoreB={m.score2}
              big
            />
          ))}
        </Column>
      </div>

      <div className="guaranteeWrap">
        <h3 className="guaranteeTitle">Guarantee Match (to 15)</h3>
        <p className="subtleSm">
          First-round losers play a one-game consolation so every team gets at least two matches.
        </p>
        <div className="guaranteeRow">
          {guarantee.map((m) => (
            <MatchCard
              key={`${m.round}-${m.match_label}`}
              label={m.match_label}
              a={displayTeam(m.team1_seed)}
              b={displayTeam(m.team2_seed)}
              scoreA={m.score1}
              scoreB={m.score2}
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
  children: ReactNode;
}) {
  return (
    <div className="col">
      <div className="colHeader">
        <div className="colTitle">{title}</div>
        {subtitle ? <div className="colSub">{subtitle}</div> : null}
      </div>
      <div className="colBody">{children}</div>
    </div>
  );
}

function MatchCard({
  label,
  a,
  b,
  scoreA,
  scoreB,
  big,
}: {
  label: string;
  a: string;
  b: string;
  scoreA: number | null;
  scoreB: number | null;
  big?: boolean;
}) {
  const hasScore = typeof scoreA === "number" && typeof scoreB === "number";
  return (
    <div className={`match ${big ? "matchBig" : ""}`}>
      <div className="matchLabel">{label}</div>

      <div className="teamRow">
        <div className="teamName">{a}</div>
        <div className="teamScore">{hasScore ? scoreA : ""}</div>
      </div>

      <div className="teamRow">
        <div className="teamName">{b}</div>
        <div className="teamScore">{hasScore ? scoreB : ""}</div>
      </div>
    </div>
  );
}

const css = `
  .page{ padding:24px; max-width:1200px; margin:0 auto; }
  .title{ font-size:34px; margin:0 0 10px; }
  .subtle{ opacity:.8; margin:0 0 16px; }
  .subtleSm{ opacity:.75; margin:6px 0 0; font-size:13px; }
  .callout{ background:#fff; border:1px solid rgba(0,0,0,.12); border-radius:14px; padding:14px; margin:12px 0 18px; }
  .error{ background:#fff; border:1px solid rgba(220,38,38,.35); border-radius:14px; padding:14px; color:#b91c1c; }
  .stack{ display:grid; gap:18px; }

  .card{ background:#fff; border:1px solid rgba(0,0,0,.12); border-radius:18px; padding:16px; }
  .cardHeader{ display:flex; align-items:flex-end; justify-content:space-between; gap:14px; flex-wrap:wrap; }
  .cardTitle{ margin:0; font-size:20px; }

  .bracketGrid{
    margin-top:14px;
    display:grid;
    grid-template-columns: repeat(4, minmax(220px, 1fr));
    gap:14px;
    overflow-x:auto;
    padding-bottom:6px;
  }

  .col{ border:1px solid rgba(0,0,0,.10); border-radius:16px; padding:12px; min-width:220px; }
  .colHeader{ margin-bottom:10px; }
  .colTitle{ font-weight:900; letter-spacing:.2px; }
  .colSub{ opacity:.7; font-size:12px; margin-top:2px; }

  .colBody{ display:grid; gap:10px; }

  .match{
    border:1px solid rgba(0,0,0,.10);
    border-radius:14px;
    padding:10px;
    background:rgba(255,255,255,.9);
  }
  .matchBig{ padding:14px; }
  .matchLabel{ font-size:12px; opacity:.7; font-weight:900; margin-bottom:8px; letter-spacing:.2px; }
  .teamRow{ display:flex; align-items:center; justify-content:space-between; gap:10px; padding:6px 8px; border-radius:10px; background:rgba(0,0,0,.035); margin-bottom:6px; }
  .teamRow:last-child{ margin-bottom:0; }
  .teamName{ font-weight:800; font-size:13px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .teamScore{ font-weight:900; min-width:26px; text-align:right; }

  .guaranteeWrap{
    margin-top:14px;
    border-top:1px dashed rgba(0,0,0,.18);
    padding-top:14px;
  }
  .guaranteeTitle{ margin:0; font-size:16px; }
  .guaranteeRow{ margin-top:10px; display:flex; gap:10px; flex-wrap:wrap; }
`;
