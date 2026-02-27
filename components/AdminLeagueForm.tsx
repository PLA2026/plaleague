"use client";

import { useEffect, useMemo, useState } from "react";

type Option = { id: number; name: string };

type ExistingGame = {
  id: number;
  team1_id: number;
  team2_id: number;
  score1: number;
  score2: number;
  label: string;
};

export default function AdminLeagueForm() {
  // ----- EXISTING: Record League Game -----
  const [password, setPassword] = useState("");

  const [schoolCode, setSchoolCode] = useState<"KHDS" | "BMA">("KHDS");
  const [divisionName, setDivisionName] = useState<"4-5" | "6-8">("4-5");

  const [teams, setTeams] = useState<Option[]>([]);
  const [team1Id, setTeam1Id] = useState<number | "">("");
  const [team2Id, setTeam2Id] = useState<number | "">("");

  const [score1, setScore1] = useState("");
  const [score2, setScore2] = useState("");

  const [status, setStatus] = useState("");

  // ----- NEW: Edit/Delete Existing League Game -----
  const [existingGames, setExistingGames] = useState<ExistingGame[]>([]);
  const [loadingGames, setLoadingGames] = useState(false);
  const [selectedGameId, setSelectedGameId] = useState<number | "">("");
  const [editScore1, setEditScore1] = useState("");
  const [editScore2, setEditScore2] = useState("");
  const [editStatus, setEditStatus] = useState("");

  const selectedGame = useMemo(
    () => existingGames.find((g) => g.id === selectedGameId) ?? null,
    [existingGames, selectedGameId]
  );

  // Load teams for the selected school/division (used by the Record League Game form)
  useEffect(() => {
    (async () => {
      try {
        // Your project already has an API for teams on admin score entry
        // If this endpoint name differs in your repo, tell me and I'll adjust.
        const res = await fetch(`/api/admin/teams?school=${schoolCode}&division=${divisionName}`);
        if (!res.ok) return;
        const json = await res.json();
        setTeams(json?.teams ?? []);
      } catch {
        // no-op
      }
    })();
  }, [schoolCode, divisionName]);

  async function recordLeagueGame() {
    setStatus("");
    if (!password) return setStatus("Enter admin password first.");
    if (!team1Id || !team2Id) return setStatus("Select both teams.");
    if (team1Id === team2Id) return setStatus("Teams must be different.");
    if (score1.trim() === "" || score2.trim() === "") return setStatus("Enter both scores.");

    const s1 = Number(score1);
    const s2 = Number(score2);
    if (!Number.isFinite(s1) || !Number.isFinite(s2)) return setStatus("Scores must be numbers.");

    try {
      // Existing route you already use for league entry:
      // If your repo uses a different route name, tell me what it is and I’ll swap it.
      const res = await fetch("/api/admin/teams-secure", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ password, schoolCode, divisionName }),
});
          password,
          schoolCode,
          divisionName,
          team1Id,
          team2Id,
          score1: s1,
          score2: s2,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? "Failed to save league game");

      setStatus("Saved ✅ League game recorded. Refresh the school page to see standings update.");
      setScore1("");
      setScore2("");
    } catch (e: any) {
      setStatus(`Error saving league game: ${e.message}`);
    }
  }

  async function loadExistingGames() {
    setEditStatus("");
    if (!password) return setEditStatus("Enter admin password first.");
    setLoadingGames(true);

    try {
      const res = await fetch("/api/admin/league-games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, schoolCode, divisionName }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? "Failed to load games");
      setExistingGames(json?.games ?? []);
      setEditStatus("Games loaded.");
    } catch (e: any) {
      setEditStatus(`Error loading games: ${e.message}`);
    } finally {
      setLoadingGames(false);
    }
  }

  // When selecting a game, prefill edit fields
  useEffect(() => {
    if (!selectedGame) {
      setEditScore1("");
      setEditScore2("");
      return;
    }
    setEditScore1(String(selectedGame.score1 ?? ""));
    setEditScore2(String(selectedGame.score2 ?? ""));
  }, [selectedGameId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function updateSelectedGame() {
    setEditStatus("");
    if (!password) return setEditStatus("Enter admin password first.");
    if (!selectedGameId) return setEditStatus("Select a game first.");
    if (editScore1.trim() === "" || editScore2.trim() === "") return setEditStatus("Enter both scores.");

    const s1 = Number(editScore1);
    const s2 = Number(editScore2);
    if (!Number.isFinite(s1) || !Number.isFinite(s2)) return setEditStatus("Scores must be numbers.");

    try {
      const res = await fetch("/api/admin/league-game-edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password,
          action: "update",
          matchId: selectedGameId,
          score1: s1,
          score2: s2,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? "Failed to update game");

      setEditStatus("Updated ✅ Refresh the school page to see standings update.");
      await loadExistingGames();
    } catch (e: any) {
      setEditStatus(`Error updating game: ${e.message}`);
    }
  }

  async function deleteSelectedGame() {
    setEditStatus("");
    if (!password) return setEditStatus("Enter admin password first.");
    if (!selectedGameId) return setEditStatus("Select a game first.");

    const ok = window.confirm(
      `Delete this league game (#${selectedGameId})?\n\nThis removes it entirely so standings return to “no game played” for that result.`
    );
    if (!ok) return;

    try {
      const res = await fetch("/api/admin/league-game-edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password,
          action: "delete",
          matchId: selectedGameId,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? "Failed to delete game");

      setEditStatus("Deleted ✅ Refresh the school page to see standings update.");
      setSelectedGameId("");
      await loadExistingGames();
    } catch (e: any) {
      setEditStatus(`Error deleting game: ${e.message}`);
    }
  }

  return (
    <section className="pla-card">
      <div className="pla-cardHeader">
        <h2 className="pla-cardTitle">Admin — League Games</h2>
        <p className="pla-subtleSm">Record new league games, or edit/delete existing ones.</p>
      </div>

      {/* Password */}
      <label style={{ fontWeight: 900, display: "grid", gap: 6 }}>
        Admin Password
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          placeholder="Enter admin password"
          style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid rgba(0,0,0,0.15)" }}
        />
      </label>

      {/* School + Division */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
        <label style={{ fontWeight: 900 }}>
          School
          <select
            value={schoolCode}
            onChange={(e) => setSchoolCode(e.target.value as any)}
            style={{ width: 220, padding: 10, borderRadius: 10, border: "1px solid rgba(0,0,0,0.15)" }}
          >
            <option value="KHDS">KHDS Lions</option>
            <option value="BMA">BMA Bulldogs</option>
          </select>
        </label>

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
      </div>

      {/* RECORD NEW GAME */}
      <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid rgba(0,0,0,0.08)" }}>
        <h3 style={{ margin: 0, fontSize: 16 }}>Record League Game (to 11)</h3>

        <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <label style={{ fontWeight: 900 }}>
              Team 1
              <select
                value={team1Id}
                onChange={(e) => setTeam1Id(e.target.value ? Number(e.target.value) : "")}
                style={{ width: 260, padding: 10, borderRadius: 10, border: "1px solid rgba(0,0,0,0.15)" }}
              >
                <option value="">— Select —</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </label>

            <label style={{ fontWeight: 900 }}>
              Team 2
              <select
                value={team2Id}
                onChange={(e) => setTeam2Id(e.target.value ? Number(e.target.value) : "")}
                style={{ width: 260, padding: 10, borderRadius: 10, border: "1px solid rgba(0,0,0,0.15)" }}
              >
                <option value="">— Select —</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "end" }}>
            <label style={{ fontWeight: 900 }}>
              Team 1 Score
              <input
                value={score1}
                onChange={(e) => setScore1(e.target.value)}
                inputMode="numeric"
                placeholder="e.g. 11"
                style={{ width: 140, padding: 10, borderRadius: 10, border: "1px solid rgba(0,0,0,0.15)" }}
              />
            </label>

            <label style={{ fontWeight: 900 }}>
              Team 2 Score
              <input
                value={score2}
                onChange={(e) => setScore2(e.target.value)}
                inputMode="numeric"
                placeholder="e.g. 7"
                style={{ width: 140, padding: 10, borderRadius: 10, border: "1px solid rgba(0,0,0,0.15)" }}
              />
            </label>

            <button
              onClick={recordLeagueGame}
              style={{
                padding: "10px 14px",
                borderRadius: 12,
                border: "1px solid rgba(0,0,0,0.15)",
                background: "white",
                fontWeight: 900,
                cursor: "pointer",
              }}
            >
              Save League Game
            </button>
          </div>

          {status ? (
            <div style={{ padding: 12, borderRadius: 12, background: "rgba(2,6,23,0.04)", fontWeight: 700 }}>
              {status}
            </div>
          ) : null}
        </div>
      </div>

      {/* EDIT/DELETE EXISTING GAME */}
      <div style={{ marginTop: 18, paddingTop: 14, borderTop: "1px solid rgba(0,0,0,0.08)" }}>
        <h3 style={{ margin: 0, fontSize: 16 }}>Edit / Delete League Game</h3>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "end", marginTop: 10 }}>
          <button
            onClick={loadExistingGames}
            disabled={loadingGames}
            style={{
              padding: "10px 14px",
              borderRadius: 12,
              border: "1px solid rgba(0,0,0,0.15)",
              background: "white",
              fontWeight: 900,
              cursor: "pointer",
            }}
          >
            {loadingGames ? "Loading..." : "Load Existing Games"}
          </button>

          <label style={{ fontWeight: 900 }}>
            Select Game
            <select
              value={selectedGameId}
              onChange={(e) => setSelectedGameId(e.target.value ? Number(e.target.value) : "")}
              style={{ width: 520, padding: 10, borderRadius: 10, border: "1px solid rgba(0,0,0,0.15)" }}
            >
              <option value="">— Select —</option>
              {existingGames.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "end", marginTop: 10 }}>
          <label style={{ fontWeight: 900 }}>
            New Team 1 Score
            <input
              value={editScore1}
              onChange={(e) => setEditScore1(e.target.value)}
              inputMode="numeric"
              placeholder="e.g. 11"
              style={{ width: 160, padding: 10, borderRadius: 10, border: "1px solid rgba(0,0,0,0.15)" }}
            />
          </label>

          <label style={{ fontWeight: 900 }}>
            New Team 2 Score
            <input
              value={editScore2}
              onChange={(e) => setEditScore2(e.target.value)}
              inputMode="numeric"
              placeholder="e.g. 7"
              style={{ width: 160, padding: 10, borderRadius: 10, border: "1px solid rgba(0,0,0,0.15)" }}
            />
          </label>

          <button
            onClick={updateSelectedGame}
            style={{
              padding: "10px 14px",
              borderRadius: 12,
              border: "1px solid rgba(0,0,0,0.15)",
              background: "white",
              fontWeight: 900,
              cursor: "pointer",
            }}
          >
            Update Score
          </button>

          <button
            onClick={deleteSelectedGame}
            style={{
              padding: "10px 14px",
              borderRadius: 12,
              border: "1px solid rgba(220,38,38,0.35)",
              background: "rgba(220,38,38,0.08)",
              fontWeight: 900,
              cursor: "pointer",
            }}
          >
            Delete Game
          </button>
        </div>

        {editStatus ? (
          <div style={{ marginTop: 10, padding: 12, borderRadius: 12, background: "rgba(2,6,23,0.04)", fontWeight: 700 }}>
            {editStatus}
          </div>
        ) : null}
      </div>
    </section>
  );
}
