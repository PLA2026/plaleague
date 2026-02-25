"use client";

import { useMemo, useState } from "react";

type MatchOption = {
  id: number;
  division_name: string;
  round: string;
  match_label: string;
  complete?: boolean;
};

type GameInput = { game_number: number; points1: string; points2: string };

export default function AdminTournamentForm() {
  const [password, setPassword] = useState("");
  const [divisionName, setDivisionName] = useState<"4-5" | "6-8">("4-5");

  const [matches, setMatches] = useState<MatchOption[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(false);

  const [selectedMatchId, setSelectedMatchId] = useState<number | null>(null);

  const [games, setGames] = useState<GameInput[]>([
    { game_number: 1, points1: "", points2: "" },
    { game_number: 2, points1: "", points2: "" },
    { game_number: 3, points1: "", points2: "" },
  ]);

  const [status, setStatus] = useState<string>("");

  const selectedMatch = useMemo(
    () => matches.find((m) => m.id === selectedMatchId) ?? null,
    [matches, selectedMatchId]
  );

  async function loadMatches() {
    setStatus("");
    setLoadingMatches(true);
    try {
      const res = await fetch(`/api/admin/tournament-matches?division=${encodeURIComponent(divisionName)}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? "Failed to load matches");
      setMatches(json?.matches ?? []);
      setStatus("Matches loaded.");
    } catch (e: any) {
      setStatus(`Error loading matches: ${e.message}`);
    } finally {
      setLoadingMatches(false);
    }
  }

  async function saveMatchBo3() {
    setStatus("");
    if (!password) return setStatus("Enter admin password first.");
    if (!selectedMatchId) return setStatus("Select a match first.");

    const cleaned = games
      .map((g) => ({
        game_number: g.game_number,
        points1: g.points1.trim(),
        points2: g.points2.trim(),
      }))
      .filter((g) => g.points1 !== "" && g.points2 !== "");

    if (cleaned.length < 2) {
      return setStatus("Enter at least Game 1 and Game 2 scores (Game 3 optional).");
    }

    try {
      const res = await fetch("/api/admin/tournament-score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password,
          matchId: selectedMatchId,
          games: cleaned.map((g) => ({
            game_number: g.game_number,
            points1: Number(g.points1),
            points2: Number(g.points2),
          })),
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? "Failed to save tournament match");

      setStatus("Saved ✅ Winner updated + bracket advanced. Refresh /tournament to see updates.");
      await loadMatches();
    } catch (e: any) {
      setStatus(`Error saving match: ${e.message}`);
    }
  }

  async function clearSelectedMatch() {
    setStatus("");
    if (!password) return setStatus("Enter admin password first.");
    if (!selectedMatchId) return setStatus("Select a match first.");

    const ok = window.confirm(
      `Clear match ${selectedMatch?.match_label ?? ""}?\n\nThis deletes its saved games and removes the winner.\nDownstream auto-filled matches (WIN/LOSE) in this division will also be cleared to avoid stale bracket state.`
    );
    if (!ok) return;

    try {
      const res = await fetch("/api/admin/tournament-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, action: "clearMatch", matchId: selectedMatchId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? "Failed to clear match");

      setStatus("Match cleared ✅ (no games played). Refresh /tournament.");
      setGames([
        { game_number: 1, points1: "", points2: "" },
        { game_number: 2, points1: "", points2: "" },
        { game_number: 3, points1: "", points2: "" },
      ]);
      await loadMatches();
    } catch (e: any) {
      setStatus(`Error clearing match: ${e.message}`);
    }
  }

  async function resetDivision() {
    setStatus("");
    if (!password) return setStatus("Enter admin password first.");

    const ok = window.confirm(
      `RESET ENTIRE DIVISION (${divisionName})?\n\nThis deletes ALL tournament games and clears ALL winners in this division.\nSeeded slots remain, but all results are wiped back to “no games played”.`
    );
    if (!ok) return;

    try {
      const res = await fetch("/api/admin/tournament-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, action: "resetDivision", divisionName }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? "Failed to reset division");

      setStatus("Division reset ✅ All games cleared. Refresh /tournament.");
      setSelectedMatchId(null);
      setGames([
        { game_number: 1, points1: "", points2: "" },
        { game_number: 2, points1: "", points2: "" },
        { game_number: 3, points1: "", points2: "" },
      ]);
      await loadMatches();
    } catch (e: any) {
      setStatus(`Error resetting division: ${e.message}`);
    }
  }

  return (
    <section className="pla-card">
      <div className="pla-cardHeader">
        <h2 className="pla-cardTitle">Tournament — Enter / Edit Match Scores (Bo3)</h2>
        <p className="pla-subtleSm">Save, clear a match, or reset a full division.</p>
      </div>

      <div style={{ display: "grid", gap: 12 }}>
        <label style={{ fontWeight: 900 }}>
          Admin Password
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            placeholder="Enter admin password"
            style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid rgba(0,0,0,0.15)" }}
          />
        </label>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "end" }}>
          <label style={{ fontWeight: 900 }}>
            Division
            <select
              value={divisionName}
              onChange={(e) => setDivisionName(e.target.value as any)}
              style={{ width: 220, padding: 10, borderRadius: 10, border: "1px solid rgba(0,0,0,0.15)" }}
            >
              <option value="4-5">Grades 4–5</option>
              <option value="6-8">Grades 6–8</option>
            </select>
          </label>

          <button
            onClick={loadMatches}
            disabled={loadingMatches}
            style={{
              padding: "10px 14px",
              borderRadius: 12,
              border: "1px solid rgba(0,0,0,0.15)",
              background: "white",
              fontWeight: 900,
              cursor: "pointer",
            }}
          >
            {loadingMatches ? "Loading..." : "Load Matches"}
          </button>

          <button
            onClick={resetDivision}
            style={{
              padding: "10px 14px",
              borderRadius: 12,
              border: "1px solid rgba(220,38,38,0.35)",
              background: "rgba(220,38,38,0.08)",
              fontWeight: 900,
              cursor: "pointer",
            }}
          >
            Reset Division
          </button>
        </div>

        <label style={{ fontWeight: 900 }}>
          Select Match
          <select
            value={selectedMatchId ?? ""}
            onChange={(e) => setSelectedMatchId(e.target.value ? Number(e.target.value) : null)}
            style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid rgba(0,0,0,0.15)" }}
          >
            <option value="">— Select —</option>
            {matches.map((m) => (
              <option key={m.id} value={m.id}>
                {m.round} • {m.match_label} {m.complete ? "✅" : ""}
              </option>
            ))}
          </select>
        </label>

        <div style={{ display: "grid", gap: 10 }}>
          {games.map((g, idx) => (
            <div key={g.game_number} style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ width: 72, fontWeight: 900 }}>Game {g.game_number}</div>

              <input
                inputMode="numeric"
                placeholder="Team 1"
                value={games[idx].points1}
                onChange={(e) => {
                  const next = [...games];
                  next[idx] = { ...next[idx], points1: e.target.value };
                  setGames(next);
                }}
                style={{ width: 110, padding: 10, borderRadius: 10, border: "1px solid rgba(0,0,0,0.15)" }}
              />

              <div style={{ fontWeight: 900 }}>–</div>

              <input
                inputMode="numeric"
                placeholder="Team 2"
                value={games[idx].points2}
                onChange={(e) => {
                  const next = [...games];
                  next[idx] = { ...next[idx], points2: e.target.value };
                  setGames(next);
                }}
                style={{ width: 110, padding: 10, borderRadius: 10, border: "1px solid rgba(0,0,0,0.15)" }}
              />
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            onClick={saveMatchBo3}
            style={{
              padding: "10px 14px",
              borderRadius: 12,
              border: "1px solid rgba(0,0,0,0.15)",
              background: "white",
              fontWeight: 900,
              cursor: "pointer",
            }}
          >
            Save / Update Match (Bo3)
          </button>

          <button
            onClick={clearSelectedMatch}
            style={{
              padding: "10px 14px",
              borderRadius: 12,
              border: "1px solid rgba(220,38,38,0.35)",
              background: "rgba(220,38,38,0.08)",
              fontWeight: 900,
              cursor: "pointer",
            }}
          >
            Clear Selected Match
          </button>
        </div>

        {status ? (
          <div style={{ padding: 12, borderRadius: 12, background: "rgba(2,6,23,0.04)", fontWeight: 700 }}>
            {status}
          </div>
        ) : null}
      </div>
    </section>
  );
}
