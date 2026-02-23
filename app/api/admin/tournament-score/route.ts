import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type Body = {
  password?: string;
  matchId?: number;
  games?: Array<{ gameNumber: number; score1: number; score2: number }>;
};

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as Body;

  if (!body.password || body.password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const matchId = Number(body.matchId);
  if (!matchId || !Number.isFinite(matchId)) {
    return NextResponse.json({ error: "Missing matchId" }, { status: 400 });
  }

  const games = (body.games ?? [])
    .filter((g) => g && Number.isFinite(g.gameNumber) && Number.isFinite(g.score1) && Number.isFinite(g.score2))
    .map((g) => ({
      gameNumber: Number(g.gameNumber),
      score1: Number(g.score1),
      score2: Number(g.score2),
    }));

  if (games.length === 0) {
    return NextResponse.json({ error: "No games provided" }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );

  // Save each game via RPC
  for (const g of games) {
    const { error } = await supabase.rpc("save_tournament_match_game", {
      p_match_id: matchId,
      p_game_number: g.gameNumber,
      p_points1: g.score1,
      p_points2: g.score2,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Advance winners into downstream matches
  const { error: advError } = await supabase.rpc("advance_tournament_winners");
  if (advError) return NextResponse.json({ error: advError.message }, { status: 400 });

  return NextResponse.json({ ok: true });
}
