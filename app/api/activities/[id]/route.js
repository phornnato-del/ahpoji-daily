import { NextResponse } from "next/server";
import { query, APP_USER_ID } from "@/lib/db";

export async function PUT(req, { params }) {
  try {
    const id = Number(params.id);
    const body = await req.json();
    const { ACTIVITY_NAME, CATEGORY_ID = null, DURATION_MINUTES = null, ACTIVITY_DATE = null, NOTE = null } = body;

    if (!ACTIVITY_NAME || !ACTIVITY_NAME.trim()) {
      return NextResponse.json({ error: "ACTIVITY_NAME is required" }, { status: 400 });
    }

    await query(
      `UPDATE activities SET ACTIVITY_NAME = ?, CATEGORY_ID = ?, DURATION_MINUTES = ?, ACTIVITY_DATE = ?, NOTE = ?
       WHERE ID = ? AND USER_ID = ?`,
      [ACTIVITY_NAME.trim(), CATEGORY_ID, DURATION_MINUTES, ACTIVITY_DATE, NOTE, id, APP_USER_ID]
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(_req, { params }) {
  try {
    const id = Number(params.id);
    await query("DELETE FROM activities WHERE ID = ? AND USER_ID = ?", [id, APP_USER_ID]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
