import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { password, schoolCode, divisionName } = body ?? {};

    if (!process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: "ADMIN_PASSWORD not set" }, { status: 500 });
    }
    if (password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!schoolCode || !divisionName) {
      return NextResponse.json({ error: "schoolCode and divisionName required" }, { status: 400 });
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const service = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    if (!url || !service) {
      return NextResponse.json(
        { error: "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY" },
        { status: 500 }
      );
    }

    const supabase = createClient(url, service, { auth: { persistSession: false } });

    // Resolve school_id
    const { data: schoolRow, error: schoolErr } = await supabase
      .from("schools")
      .select("id,name")
      .ilike("name", `%${schoolCode}%`)
      .maybeSingle();

    if (schoolErr) return NextResponse.json({ error: schoolErr.message }, { status: 500 });
    if (!schoolRow?.id) return NextResponse.json({ error: "School not found" }, { status: 404 });

    // Resolve division_id
    const { data: divRow, error: divErr } = await supabase
      .from("divisions")
      .select("id,name,school_id")
      .eq("school_id", schoolRow.id)
      .eq("name", divisionName)
      .maybeSingle();

    if (divErr) return NextResponse.json({ error: divErr.message }, { status: 500 });
    if (!divRow?.id) return NextResponse.json({ error: "Division not found" }, { status: 404 });

    // Pull league games for this division (raw scores)
    const { data: games, error: gamesErr } = await supabase
      .from("league_matches")
      .select("id,division_id,team1_id,team2_id,score1,score2")
      .eq("division_id", divRow.id)
      .order("id", { ascending: false })
      .limit(250);

    if (gamesErr) return NextResponse.json({ error: gamesErr.message }, { status: 500 });

    // Load team names for display labels
    const teamIds = Array.from(
      new Set((games ?? []).flatMap((g: any) => [g.team1_id, g.team2_id]).filter(Boolean))
    );

    const { data: teams, error: teamsErr } = await supabase
      .from("teams")
      .select("id,name")
      .in("id", teamIds.length ? teamIds : [0]);

    if (teamsErr) return NextResponse.json({ error: teamsErr.message }, { status: 500 });

    const nameById = new Map<number, string>((teams ?? []).map((t: any) => [t.id, t.name]));

    const out =
      (games ?? []).map((g: any) => ({
        id: g.id,
        team1_id: g.team1_id,
        team2_id: g.team2_id,
        score1: g.score1,
        score2: g.score2,
        label: `#${g.id} — ${nameById.get(g.team1_id) ?? "Team"} ${g.score1}-${g.score2} ${
          nameById.get(g.team2_id) ?? "Team"
        }`,
      })) ?? [];

    return NextResponse.json({ games: out });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Unknown error" }, { status: 500 });
  }
}
