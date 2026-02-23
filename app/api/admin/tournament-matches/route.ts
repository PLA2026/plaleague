import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const password = searchParams.get("password") ?? "";
  const division = searchParams.get("division") ?? "";

  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );

  let q = supabase
    .from("tournament_matches")
    .select("id,division_name,round,match_label,team1_seed,team2_seed,team1_id,team2_id,winner_team_id")
    .order("division_name", { ascending: true })
    .order("round", { ascending: true })
    .order("match_label", { ascending: true });

  if (division) q = q.eq("division_name", division);

  const { data, error } = await q;

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ matches: data ?? [] });
}
