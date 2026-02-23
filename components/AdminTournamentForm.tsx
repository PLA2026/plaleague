"use client";

import { useEffect, useMemo, useState } from "react";

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

type TeamRow = { id: number; name: string };

export default function AdminTournamentForm() {
  const [password, setPassword] = useState("");
  const [division, setDivision] = useState<"4-5" | "6-8">("4-5");
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [teams, setTeams] = useState<TeamRow[]>([]);
  const [matchId, setMatchId] = useState<number | "">("");
  const [status, setStatus] = useState("");

  // Game scores
  const [g1a, setG1a] = useState("");
  const [g1b, setG1b] = useState("");
  const [g2a, setG2a] = useState("");
  const [g2b, setG2b] = useState("");
  const [g3a, setG3a] = useState("");
  const [g3b, setG3b] = useState("");

  const teamNameById = useMemo(() => {
    const m = new Map<number, string>();
    for (const t of teams) m.set(t.id, t.name);
    return m;
  }, [teams]);

  const selectedMatch = useMemo(
    () => matches.find((m) => m.id === matchId) ?? null,
    [matches, matchId]
  );

  function labelForMatch(m: MatchRow) {
    const t1 =
      m.team1_id ? teamNameById.get(m.team1_id) ?? `#${m.team1_id}` : m.team1_seed ?? "TBD";
    const t2 =
      m.team2_id ? teamNameById.get(m.team2_id) ?? `#${m.team2_id}` : m.team2_seed ?? "TBD";
    const winner =
      m.winner_team_id ? ` ✅ Winner: ${teamNameById.get(m.winner_team_id) ?? `#${m.winner_team_id}`}` : "";
    return `${m.round} • ${m.match_label}: ${t1} vs ${t2}${winner}`;
  }

  async function loadMatches() {
    if (!password) {
      setStatus("Enter password to load tournament matches.");
      return;
    }
    setStatus("Loading matches...");
    const res = await fetch(
      `/api/admin/tournament-matches?password=${encodeURIComponent(password)}&division=${encodeURIComponent(division)}`
    );
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setStatus(`Error: ${json.error ?? "Unknown error"}`);
      return;
    }
    setMatches(json.matches ?? []);
    setStatus("Matches loaded ✅");
  }

  async function loadTeams() {
    if (!password) return;
    const res = await fetch(`/api/admin/teams?password=${encodeURIComponent(password)}`);
    const json = await res.json().catch(() => ({}));
    if (res.ok) setTeams(json.teams ?? []);
  }

  useEffect(() => {
    loadTeams();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [password]);

  useEffect(() => {
    // When division changes, clear selection and reload (if password exists)
    setMatchId("");
    setMatches([]);
    setStatus("");
    if (password) loadMatches();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [division]);

  function parseIntOrNull(v: string) {
    if (v.trim() === "") return null;
    const n = Number(v);
    if (!Number.isFinite(n)) return null;
    return Math.trunc(n);
  }

  async function saveBo3() {
    if (!password) return setStatus("Enter admin password.");
    if (!matchId) return setStatus("Select a match.");

    // Build games array from inputs (only include complete pairs)
    const games: Array<{ gameNumber: number; score1: number; score2: number }> = [];

    const g1aN = parseIntOrNull(g1a);
    const g1bN = parseIntOrNull(g1b);
    if (g1aN !== null && g1bN !== null) games.push({ gameNumber: 1, score1: g1aN, score2: g1bN });

    const g2aN = parseIntOrNull(g2a);
    const g2bN = parseIntOrNull(g2b);
    if (g2aN !== null && g2bN !== null) games.push({ gameNumber: 2, score1: g2aN, score2: g2bN });

    const g3aN = parseIntOrNull(g3a);
    const g3bN = parseIntOrNull(g3b);
    if (g3aN !== null && g3bN !== null) games.push({ gameNumber: 3, score1: g3aN, score2: g3bN });

    if (games.length === 0) return setStatus("Enter at least Game 1 scores.");

    setStatus("Saving tournament scores...");
    const res = await fetch("/api/admin/tournament-score", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password, matchId, games }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return setStatus(`Error: ${json.error ?? "Unknown error"}`);

    setStatus("Saved ✅ Winners advanced. Refresh /tournament.");
    await loadMatches();
  }

  function clearScores() {
    setG1a(""); setG1b("");
    setG2a(""); setG2b("");
    setG3a(""); setG3b("");
  }

  return (
    <section style={card}>
      <h2 style={{ marginTop: 0 }}>Tournament — Enter Match Scores (Best 2 of 3)</h2>
      <p style={{ opacity: 0.8, marginTop: 6 }}>
        Enter Game 1 / Game 2 / (optional) Game 3 scores. Saving will compute the winner and advance teams.
      </p>

      <div style={row}>
        <input
          style={input}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          placeholder="Admin password"
        />

        <select style={select} value={division} onChange={(e) => setDivision(e.target.value as any)}>
          <option value="4-5">Grades 4–5</option>
          <option value="6-8">Grades 6–8</option>
        </select>

        <button style={button} onClick={loadMatches}>
          Load Matches
        </button>
      </div>

      <div style={{ marginTop: 12 }}>
        <label style={label}>Match</label>
        <select
          style={{ ...select, width: "100%" }}
          value={matchId}
          onChange={(e) => {
            const v = e.target.value;
            setMatchId(v ? Number(v) : "");
            clearScores();
          }}
        >
          <option value="">Select a match…</option>
          {matches.map((m) => (
            <option key={m.id} value={m.id}>
              {labelForMatch(m)}
            </option>
          ))}
        </select>

        {selectedMatch ? (
          <div style={{ marginTop: 10, opacity: 0.85, fontSize: 13 }}>
            <div><strong>Tip:</strong> Most matches are to 11 (win by 1). Guarantee match is to 15 (not entered here yet).</div>
            <div style={{ marginTop: 4 }}>
              Current winner:{" "}
              <strong>
                {selectedMatch.winner_team_id
                  ? teamNameById.get(selectedMatch.winner_team_id) ?? `#${selectedMatch.winner_team_id}`
                  : "Not decided"}
              </strong>
            </div>
          </div>
        ) : null}
      </div>

      <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
        <GameRow title="Game 1" a={g1a} b={g1b} setA={setG1a} setB={setG1b} />
        <GameRow title="Game 2" a={g2a} b={g2b} setA={setG2a} setB={setG2b} />
        <GameRow title="Game 3 (if needed)" a={g3a} b={g3b} setA={setG3a} setB={setG3b} />
      </div>

      <div style={{ ...row, marginTop: 14 }}>
        <button style={button} onClick={saveBo3}>
          Save Match (Bo3)
        </button>
        <button style={buttonSecondary} onClick={clearScores}>
          Clear Inputs
        </button>
      </div>

      {status ? <p style={{ marginTop: 10 }}>{status}</p> : null}
    </section>
  );
}

function GameRow({
  title,
  a,
  b,
  setA,
  setB,
}: {
  title: string;
  a: string;
  b: string;
  setA: (v: string) => void;
  setB: (v: string) => void;
}) {
  return (
    <div style={gameRow}>
      <div style={{ fontWeight: 900 }}>{title}</div>
      <div style={miniRow}>
        <input style={miniInput} value={a} onChange={(e) => setA(e.target.value)} placeholder="Team 1" />
        <span style={{ opacity: 0.7 }}>–</span>
        <input style={miniInput} value={b} onChange={(e) => setB(e.target.value)} placeholder="Team 2" />
      </div>
    </div>
  );
}

const card: React.CSSProperties = {
  background: "white",
  border: "1px solid rgba(0,0,0,0.12)",
  borderRadius: 14,
  padding: 16,
};

const row: React.CSSProperties = {
  display: "flex",
  gap: 10,
  alignItems: "center",
  flexWrap: "wrap",
};

const label: React.CSSProperties = {
  display: "block",
  fontSize: 12,
  fontWeight: 900,
  opacity: 0.75,
  marginBottom: 6,
};

const input: React.CSSProperties = {
  padding: "10px 10px",
  borderRadius: 10,
  border: "1px solid rgba(0,0,0,0.2)",
  fontSize: 14,
  minWidth: 240,
};

const select: React.CSSProperties = {
  padding: "10px 10px",
  borderRadius: 10,
  border: "1px solid rgba(0,0,0,0.2)",
  fontSize: 14,
  minWidth: 180,
  background: "white",
};

const button: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 12,
  border: "0",
  background: "#0f172a",
  color: "white",
  fontWeight: 900,
  cursor: "pointer",
};

const buttonSecondary: React.CSSProperties = {
  ...button,
  background: "rgba(15,23,42,0.10)",
  color: "#0f172a",
  border: "1px solid rgba(0,0,0,0.12)",
};

const gameRow: React.CSSProperties = {
  border: "1px solid rgba(0,0,0,0.10)",
  borderRadius: 12,
  padding: 12,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  flexWrap: "wrap",
};

const miniRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
};

const miniInput: React.CSSProperties = {
  width: 90,
  padding: "8px 10px",
  borderRadius: 10,
  border: "1px solid rgba(0,0,0,0.2)",
};
