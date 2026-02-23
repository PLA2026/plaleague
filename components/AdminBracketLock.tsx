"use client";

import { useState } from "react";

export default function AdminBracketLock() {
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");

  async function lock() {
    setStatus("Locking seeds + generating bracket...");

    const res = await fetch("/api/admin/lock-bracket", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      setStatus(`Error: ${json.error ?? "Unknown error"}`);
      return;
    }

    setStatus("Locked ✅ Visit /tournament");
  }

  return (
    <section style={card}>
      <h2 style={{ marginTop: 0 }}>Tournament</h2>
      <p style={{ opacity: 0.8, marginTop: 6 }}>
        Locks seeds based on current standings and generates the bracket.
      </p>

      <div style={row}>
        <input
          style={input}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          placeholder="Admin password"
        />
        <button style={button} onClick={lock}>
          Lock Seeds &amp; Generate Bracket
        </button>
      </div>

      {status && <p style={{ marginTop: 10 }}>{status}</p>}
    </section>
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
  marginTop: 10,
};

const input: React.CSSProperties = {
  padding: "10px 10px",
  borderRadius: 10,
  border: "1px solid rgba(0,0,0,0.2)",
  fontSize: 14,
  minWidth: 240,
};

const button: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 12,
  border: "0",
  background: "#0f172a",
  color: "white",
  fontWeight: 800,
  cursor: "pointer",
};
