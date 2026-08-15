import { NextResponse } from "next/server";
import { query, APP_USER_ID } from "@/lib/db";

export async function PUT(req, { params }) {
  try {
    const id = Number(params.id);
    const body = await req.json();
    const { COMPLETED } = body;

    await query(
      `UPDATE goal_tasks SET COMPLETED = ?, UPDATED_AT = CURDATE() WHERE ID = ? AND USER_ID = ?`,
      [COMPLETED ? 1 : 0, id, APP_USER_ID]
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(_req, { params }) {
  try {
    const id = Number(params.id);
    await query("DELETE FROM goal_tasks WHERE ID = ? AND USER_ID = ?", [id, APP_USER_ID]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
