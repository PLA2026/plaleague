export const dynamic = "force-dynamic";
export const revalidate = 0;

import { supabase } from "@/lib/supabaseClient";
import type { ReactNode } from "react";

type SeedRow = {
  division_name: string;
  seed: number;
  school: { name: string }[];
  team: { id: number; name: string }[];
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

  const { data: seedsData, error: seedsError } = await supabase
    .from("tournament_seeds")
    .select("division_name,seed, team:teams(id,name), school:schools(name)");

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
          <div>
            <strong>Data error</strong>
          </div>
          {seedsError ? <div>Seeds: {seedsError.message}</div> : null}
          {matchesError ? <div>Matches: {matchesError.message}</div> : null}
        </div>
        <Styles />
      </main>
    );
  }

  const seeds = (seedsData ?? []) as unknown as SeedRow[];
  const matches = (matchesData ?? []) as unknown as MatchRow[];

  const seedNameByDivision = new Map<string, Map<string, string>>();
  for (const row of seeds) {
    const div = row.division_name;
    if (!seedNameByDivision.has(div)) seedNameByDivision.set(div, new Map());
    const map = seedNameByDivision.get(div)!;

    const schoolName = row.school?.[0]?.name ?? "";
    const schoolShort =
      schoolName.toLowerCase().includes("khds") ? "KHDS" : "BMA";

    const key = keyForSeed(schoolShort as "KHDS" | "BMA", row.seed);
    map.set(key, row.team?.[0]?.name ?? `Seed ${row.seed}`);
  }

  const divisions = Array.from(
    new Set(matches.map((m) => m.division_name).filter(Boolean))
  );

  return (
    <main className="page">
      <h1 className="title">End-of-Season Tournament</h1>
      <p className="subtle">
        Bracket status: <strong>{state?.locked ? "Locked ✅" : "Not locked yet"}</strong>
        {state?.locked_at
          ? ` (locked at ${new Date(state.locked_at).toLocaleString()})`
          : ""}
      </p>

      {!state?.locked ? (
        <div className="callout">
          Go to <code>/admin</code> → Tournament →{" "}
          <strong>Lock Seeds &amp; Generate Bracket</strong>.
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

      <Styles />
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
    if (seedNameMap.has(seedLabel)) return seedNameMap.get(seedLabel)!;
    return seedLabel;
  }

  return (
    <section className="card">
      <div className="cardHeader">
        <h2 className="cardTitle">{prettyDivisionName(divisionName)}</h2>
        <p className="subtleSm">Cross-fill bracket + guarantee match</p>
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
