import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type Body = {
  password?: string;
  divisionId?: number;
  teamAId?: number;
  teamBId?: number;
  scoreA?: number;
  scoreB?: number;
};

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as Body;

  if (!body.password || body.password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
  });

  const divisionId = Number(body.divisionId);
  const teamAId = Number(body.teamAId);
  const teamBId = Number(body.teamBId);
  const scoreA = Number(body.scoreA);
  const scoreB = Number(body.scoreB);

  if (![divisionId, teamAId, teamBId, scoreA, scoreB].every(Number.isFinite)) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { error } = await supabase.rpc("record_league_game", {
    p_division_id: divisionId,
    p_team_a_id: teamAId,
    p_team_b_id: teamBId,
    p_score_a: scoreA,
    p_score_b: scoreB,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
