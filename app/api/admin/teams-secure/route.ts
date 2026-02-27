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
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(url, anon);

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

    // Load teams in this division
    const { data: teams, error: teamsErr } = await supabase
      .from("teams")
      .select("id,name")
      .eq("division_id", divRow.id)
      .order("id", { ascending: true });

    if (teamsErr) return NextResponse.json({ error: teamsErr.message }, { status: 500 });

    return NextResponse.json({ teams: teams ?? [] });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Unknown error" }, { status: 500 });
  }
}
