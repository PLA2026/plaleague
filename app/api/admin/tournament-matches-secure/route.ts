import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { password, divisionName } = body ?? {};

    if (!process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: "ADMIN_PASSWORD not set" }, { status: 500 });
    }
    if (password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!divisionName) {
      return NextResponse.json({ error: "divisionName required" }, { status: 400 });
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(url, anon);

    const { data, error } = await supabase
      .from("tournament_matches")
      .select("id,division_name,round,match_label,winner_team_id")
      .eq("division_name", divisionName)
      .order("round", { ascending: true })
      .order("match_label", { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const matches =
      (data ?? []).map((m: any) => ({
        id: m.id,
        division_name: m.division_name,
        round: m.round,
        match_label: m.match_label,
        complete: !!m.winner_team_id,
      })) ?? [];

    return NextResponse.json({ matches });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Unknown error" }, { status: 500 });
  }
}
