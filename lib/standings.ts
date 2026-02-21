export type TeamRow = {
  id: number;
  name: string;
  wins: number;
  losses: number;
  points_for: number;
  points_against: number;
};

export function sortStandings(teams: TeamRow[]) {
  return [...teams].sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;

    const diffA = (a.points_for ?? 0) - (a.points_against ?? 0);
    const diffB = (b.points_for ?? 0) - (b.points_against ?? 0);

    if (diffB !== diffA) return diffB - diffA;

    return (b.points_for ?? 0) - (a.points_for ?? 0);
  });
}
