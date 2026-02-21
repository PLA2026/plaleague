import { TeamRow, sortStandings } from "@/lib/standings";

export default function StandingsTable({ teams }: { teams: TeamRow[] }) {
  const sorted = sortStandings(teams);

  return (
    <div style={{ overflowX: "auto" }}>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          background: "white",
          borderRadius: 12
        }}
      >
        <thead>
          <tr style={{ background: "#0f172a", color: "white" }}>
            {["Team", "W", "L", "PF", "PA", "+/-"].map((h) => (
              <th
                key={h}
                style={{
                  textAlign: "left",
                  padding: "12px 10px",
                  fontSize: 13,
                  letterSpacing: 0.5
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((t) => {
            const diff =
              (t.points_for ?? 0) - (t.points_against ?? 0);

            return (
              <tr
                key={t.id}
                style={{
                  borderTop: "1px solid rgba(0,0,0,0.08)"
                }}
              >
                <td style={{ padding: 10, fontWeight: 800 }}>
                  {t.name}
                </td>
                <td style={{ padding: 10 }}>{t.wins ?? 0}</td>
                <td style={{ padding: 10 }}>{t.losses ?? 0}</td>
                <td style={{ padding: 10 }}>{t.points_for ?? 0}</td>
                <td style={{ padding: 10 }}>{t.points_against ?? 0}</td>
                <td style={{ padding: 10 }}>{diff}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
