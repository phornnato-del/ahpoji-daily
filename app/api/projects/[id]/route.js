import { NextResponse } from "next/server";
import { query, APP_USER_ID } from "@/lib/db";

export async function PUT(req, { params }) {
  try {
    const id = Number(params.id);
    const body = await req.json();
    const {
      NAME,
      DESCRIPTION = null,
      TECHNOLOGY = null,
      STATUS = null,
      START_DATE = null,
      END_DATE = null,
      PROGRESS = 0,
    } = body;

    if (!NAME || !NAME.trim()) {
      return NextResponse.json({ error: "NAME is required" }, { status: 400 });
    }

    await query(
      `UPDATE projects SET
        NAME = ?, DESCRIPTION = ?, TECHNOLOGY = ?, STATUS = ?, START_DATE = ?, END_DATE = ?,
        PROGRESS = ?, UPDATED_AT = CURDATE()
       WHERE ID = ? AND USER_ID = ?`,
      [NAME.trim(), DESCRIPTION, TECHNOLOGY, STATUS, START_DATE, END_DATE, PROGRESS, id, APP_USER_ID]
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(_req, { params }) {
  try {
    const id = Number(params.id);
    await query("DELETE FROM project_tasks WHERE PROJECT_ID = ? AND USER_ID = ?", [id, APP_USER_ID]);
    await query("DELETE FROM projects WHERE ID = ? AND USER_ID = ?", [id, APP_USER_ID]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
