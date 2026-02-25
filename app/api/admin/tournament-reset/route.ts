import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { password, action, matchId, divisionName } = body ?? {};

    if (!process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: "ADMIN_PASSWORD not set" }, { status: 500 });
    }
    if (password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Bad password" }, { status: 401 });
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(url, anon);

    if (action === "clearMatch") {
      if (!matchId) return NextResponse.json({ error: "matchId required" }, { status: 400 });

      const { error } = await supabase.rpc("admin_clear_tournament_match", {
        p_match_id: matchId,
      });

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true });
    }

    if (action === "resetDivision") {
      if (!divisionName) return NextResponse.json({ error: "divisionName required" }, { status: 400 });

      const { error } = await supabase.rpc("admin_reset_tournament_division", {
        p_division: divisionName,
      });

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Unknown error" }, { status: 500 });
  }
}
