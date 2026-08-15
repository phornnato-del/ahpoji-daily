import { NextResponse } from "next/server";
import { query, APP_USER_ID } from "@/lib/db";

export async function POST(req, { params }) {
  try {
    const projectId = Number(params.id);
    const body = await req.json();
    const { TITLE, DESCRIPTION = null, PRIORITY_ID = null, STATUS_ID = 1, DUE_DATE = null } = body;

    if (!TITLE || !TITLE.trim()) {
      return NextResponse.json({ error: "TITLE is required" }, { status: 400 });
    }

    const result = await query(
      `INSERT INTO project_tasks (USER_ID, PROJECT_ID, TITLE, DESCRIPTION, PRIORITY_ID, STATUS_ID, DUE_DATE, CREATED_AT)
       VALUES (?, ?, ?, ?, ?, ?, ?, CURDATE())`,
      [APP_USER_ID, projectId, TITLE.trim(), DESCRIPTION, PRIORITY_ID, STATUS_ID, DUE_DATE]
    );

    return NextResponse.json({ id: result.insertId }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
