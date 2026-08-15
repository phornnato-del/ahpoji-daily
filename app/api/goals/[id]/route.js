import { NextResponse } from "next/server";
import { query, APP_USER_ID } from "@/lib/db";

export async function PUT(req, { params }) {
  try {
    const id = Number(params.id);
    const body = await req.json();
    const {
      TITLE,
      DESCRIPTION = null,
      CATEGORY_ID = null,
      START_DATE = null,
      TARGET_DATE = null,
      PRIORITY_ID = null,
      STATUS_ID = null,
      PROGRESS = 0,
    } = body;

    if (!TITLE || !TITLE.trim()) {
      return NextResponse.json({ error: "TITLE is required" }, { status: 400 });
    }

    await query(
      `UPDATE goals SET
        TITLE = ?, DESCRIPTION = ?, CATEGORY_ID = ?, START_DATE = ?, TARGET_DATE = ?,
        PRIORITY_ID = ?, STATUS_ID = ?, PROGRESS = ?, UPDATED_AT = CURDATE()
       WHERE ID = ? AND USER_ID = ?`,
      [TITLE.trim(), DESCRIPTION, CATEGORY_ID, START_DATE, TARGET_DATE, PRIORITY_ID, STATUS_ID, PROGRESS, id, APP_USER_ID]
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(_req, { params }) {
  try {
    const id = Number(params.id);
    await query("DELETE FROM goal_tasks WHERE GOAL_ID = ? AND USER_ID = ?", [id, APP_USER_ID]);
    await query("DELETE FROM goals WHERE ID = ? AND USER_ID = ?", [id, APP_USER_ID]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
