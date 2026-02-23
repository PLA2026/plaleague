"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type School = { id: number; name: string };
type Division = { id: number; name: string; school_id: number };
type Team = { id: number; name: string; division_id: number };

export default function AdminLeagueForm() {
  const [password, setPassword] = useState("");
  const [schools, setSchools] = useState<School[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);

  const [schoolId, setSchoolId] = useState<number | "">("");
  const [divisionId, setDivisionId] = useState<number | "">("");
  const [teamAId, setTeamAId] = useState<number | "">("");
  const [teamBId, setTeamBId] = useState<number | "">("");
  const [scoreA, setScoreA] = useState<number | "">(11);
  const [scoreB, setScoreB] = useState<number | "">(7);

  const [status, setStatus] = useState<string>("");

  useEffect(() => {
    (async () => {
      const s = await supabase.from("schools").select("id,name").order("name");
      const d = await supabase.from("divisions").select("id,name,school_id").order("name");
      const t = await supabase.from("teams").select("id,name,division_id").order("name");
      setSchools((s.data ?? []) as School[]);
      setDivisions((d.data ?? []) as Division[]);
      setTeams((t.data ?? []) as Team[]);
    })();
  }, []);

  const filteredDivisions = useMemo(
    () => divisions.filter((d) => (schoolId === "" ? true : d.school_id === schoolId)),
    [divisions, schoolId]
  );

  const filteredTeams = useMemo(
    () => teams.filter((t) => (divisionId === "" ? true : t.division_id === divisionId)),
    [teams, divisionId]
  );

  async function submit() {
    setStatus("");

    if (!password) return setStatus("Enter admin password.");
    if (divisionId === "" || teamAId === "" || teamBId === "") return setStatus("Pick division + both teams.");
    if (teamAId === teamBId) return setStatus("Teams must be different.");

    const a = Number(scoreA);
    const b = Number(scoreB);

    if (!Number.isFinite(a) || !Number.isFinite(b)) return setStatus("Scores must be numbers.");
    if (a === b) return setStatus("No ties allowed.");
    if (a < 0 || b < 0 || a > 11 || b > 11) return setStatus("Scores must be 0–11.");
    if (!((a === 11 && b <= 10) || (b === 11 && a <= 10))) return setStatus("One team must have 11, other 0–10.");

    setStatus("Submitting...");

    const res = await fetch("/api/admin/record-game", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        password,
        divisionId,
        teamAId,
        teamBId,
        scoreA: a,
        scoreB: b,
      }),
    });

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      setStatus(`Error: ${json.error ?? "Unknown error"}`);
      return;
    }

    setStatus("Saved ✅ Refresh the school standings page to see updates.");
    <button
  onClick={async () => {
    setStatus("Locking seeds + generating bracket...");
    const res = await fetch("/api/admin/lock-bracket", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return setStatus(`Error: ${json.error ?? "Unknown error"}`);
    setStatus("Bracket locked ✅ Go to /tournament");
  }}
  style={{ ...button, marginTop: 10 }}
>
  Lock Seeds & Generate Bracket
</button>
  }

  return (
    <section style={card}>
      <h2 style={{ marginTop: 0 }}>Record League Game (to 11, win by 1)</h2>

      <div style={grid}>
        <label style={label}>
          Admin Password
          <input
            style={input}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            placeholder="Enter password"
          />
        </label>

        <label style={label}>
          School
          <select
            style={input}
            value={schoolId}
            onChange={(e) => setSchoolId(e.target.value ? Number(e.target.value) : "")}
          >
            <option value="">Select</option>
            {schools.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>

        <label style={label}>
          Division
          <select
            style={input}
            value={divisionId}
            onChange={(e) => {
              const v = e.target.value ? Number(e.target.value) : "";
              setDivisionId(v);
              setTeamAId("");
              setTeamBId("");
            }}
          >
            <option value="">Select</option>
            {filteredDivisions.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </label>

        <label style={label}>
          Team A
          <select style={input} value={teamAId} onChange={(e) => setTeamAId(e.target.value ? Number(e.target.value) : "")}>
            <option value="">Select</option>
            {filteredTeams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>

        <label style={label}>
          Team B
          <select style={input} value={teamBId} onChange={(e) => setTeamBId(e.target.value ? Number(e.target.value) : "")}>
            <option value="">Select</option>
            {filteredTeams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>

        <label style={label}>
          Score A
          <input style={input} value={scoreA} onChange={(e) => setScoreA(e.target.value === "" ? "" : Number(e.target.value))} />
        </label>

        <label style={label}>
          Score B
          <input style={input} value={scoreB} onChange={(e) => setScoreB(e.target.value === "" ? "" : Number(e.target.value))} />
        </label>
      </div>

      <button onClick={submit} style={button}>
        Save Game
      </button>

      {status && <p style={{ marginTop: 12, opacity: 0.9 }}>{status}</p>}
    </section>
  );
}

const card: React.CSSProperties = {
  background: "white",
  border: "1px solid rgba(0,0,0,0.12)",
  borderRadius: 14,
  padding: 16,
};

const grid: React.CSSProperties = {
  display: "grid",
  gap: 12,
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
};

const label: React.CSSProperties = {
  display: "grid",
  gap: 6,
  fontSize: 13,
  fontWeight: 700,
};

const input: React.CSSProperties = {
  padding: "10px 10px",
  borderRadius: 10,
  border: "1px solid rgba(0,0,0,0.2)",
  fontSize: 14,
};

const button: React.CSSProperties = {
  marginTop: 14,
  padding: "10px 14px",
  borderRadius: 12,
  border: "0",
  background: "#0f172a",
  color: "white",
  fontWeight: 800,
  cursor: "pointer",
};
