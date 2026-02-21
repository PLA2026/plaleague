export default function ProgramPage() {
  const sessions = [
    {
      title: "Session 1 — Pickleball 101",
      bullets: [
        "Rules: serves, returns, kitchen, lines, scoring, basic positioning",
        "Skills: warm-up, dink, volley, drop, serve, return",
        "Drill: Cross-court dinks",
        "Recreational play",
      ],
    },
    {
      title: "Session 2 — Pickleball 102",
      bullets: [
        "Warm-up: dinks forward/across, volleys, 3rd-shot drops, serves",
        "Court positioning + coverage, partner spacing, closing gaps",
        "Drill: Positioning while cross-court dinking",
        "Recreational play",
      ],
    },
    {
      title: "Session 3 — Serves & Returns",
      bullets: [
        "Warm-up: dinks, volleys, 3rd-shot drops, serves",
        "Serve/return targets + transition to the kitchen line",
        "Drill: Serves/returns + transition to kitchen",
        "Recreational play",
      ],
    },
    {
      title: "Session 4 — 3rd Shot Drops",
      bullets: [
        "Warm-up: dinks, volleys, 3rd-shot drops, serves",
        "Dropping + resetting into the kitchen",
        "Drill: 3rd-shot drops + transition from no-man’s-land to kitchen",
        "Recreational play",
      ],
    },
    {
      title: "Session 5 — Attacks & Resets",
      bullets: [
        "Warm-up: dinks, volleys, 3rd-shot drops, serves",
        "Attack high balls + defend/counter attacks",
        "Drill: Attack into and reset from no-man’s-land",
        "Recreational play",
      ],
    },
    {
      title: "Session 6 — Fast Hands",
      bullets: [
        "Warm-up: dinks, volleys, 3rd-shot drops, serves",
        "Speed-ups and countering resets at the kitchen line",
        "Drill: Speed-ups and resets on the kitchen line",
        "Recreational play",
      ],
    },
    {
      title: "Session 7 — ATP (Around The Post)",
      bullets: [
        "Warm-up: dinks, volleys, 3rd-shot drops, serves",
        "Hitting around the net + defending the ATP",
        "Drill: ATP shots and defense",
        "Recreational play",
      ],
    },
    {
      title: "Session 8 — The Erne",
      bullets: [
        "Warm-up: dinks, volleys, 3rd-shot drops, serves",
        "Set up and execute the Erne from outside the kitchen line",
        "Drill: Set up + execute the Erne",
        "Recreational play",
      ],
    },
  ];

  return (
    <main style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ fontSize: 36, marginBottom: 8 }}>Program</h1>

      <p style={{ opacity: 0.8, marginBottom: 18 }}>
        12-week season structure:
      </p>

      <section style={card}>
        <ul style={{ margin: "10px 0 0 18px" }}>
          <li>Weeks 1–8: Instruction + skill development</li>
          <li>Weeks 9–11: Intra-school micro-league (9 league games per team)</li>
          <li>Week 12: Inter-school championship tournament</li>
        </ul>
      </section>

      <h2 style={{ fontSize: 22, margin: "24px 0 10px" }}>
        Weeks 1–8 Curriculum
      </h2>

      <div style={{ display: "grid", gap: 12 }}>
        {sessions.map((s) => (
          <section key={s.title} style={card}>
            <div style={{ fontWeight: 900 }}>{s.title}</div>
            <ul style={{ margin: "10px 0 0 18px" }}>
              {s.bullets.map((b) => (
                <li key={b} style={{ marginBottom: 6 }}>
                  {b}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <h2 style={{ fontSize: 22, margin: "24px 0 10px" }}>
        Weeks 9–11 Micro-League
      </h2>
      <section style={card}>
        <ul style={{ margin: "10px 0 0 18px" }}>
          <li>Two age groups per school: 4th/5th and 6th–8th</li>
          <li>5 teams per age group</li>
          <li>Each week: each team plays 3 matches (single game to 11)</li>
          <li>Total: 9 league games per team</li>
          <li>
            Standings: Wins/Losses primary; Point Differential secondary; Points For if needed
          </li>
        </ul>
      </section>

      <h2 style={{ fontSize: 22, margin: "24px 0 10px" }}>
        Week 12 Tournament
      </h2>
      <section style={card}>
        <ul style={{ margin: "10px 0 0 18px" }}>
          <li>10-team bracket per age group (5 KHDS + 5 BMA)</li>
          <li>Top 3 seeds from each school receive first-round byes</li>
          <li>4 vs 5 play-in at each school</li>
          <li>
            Cross-filled bracket:
            <ul style={{ margin: "6px 0 0 18px" }}>
              <li>KHDS #1 vs Winner (BMA 4/5)</li>
              <li>BMA #1 vs Winner (KHDS 4/5)</li>
              <li>KHDS #2 vs BMA #3</li>
              <li>BMA #2 vs KHDS #3</li>
            </ul>
          </li>
          <li>Best 2 of 3 games to 11</li>
          <li>Consolation matches: 1 game to 15 (guarantees at least 2 matches)</li>
        </ul>
      </section>
    </main>
  );
}

const card: React.CSSProperties = {
  border: "1px solid rgba(0,0,0,0.15)",
  borderRadius: 14,
  padding: 16,
  background: "white",
};
