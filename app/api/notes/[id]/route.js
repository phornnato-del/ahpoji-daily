import { NextResponse } from "next/server";
import { query, APP_USER_ID } from "@/lib/db";

export async function PUT(req, { params }) {
  try {
    const id = Number(params.id);
    const body = await req.json();
    const { TITLE, CONTENT = null, CATEGORY_ID = null, TAGS = null, FAVORITE = 0 } = body;

    if (!TITLE || !TITLE.trim()) {
      return NextResponse.json({ error: "TITLE is required" }, { status: 400 });
    }

    await query(
      `UPDATE knowledge_notes SET TITLE = ?, CONTENT = ?, CATEGORY_ID = ?, TAGS = ?, FAVORITE = ?, UPDATED_AT = CURDATE()
       WHERE ID = ? AND USER_ID = ?`,
      [TITLE.trim(), CONTENT, CATEGORY_ID, TAGS, FAVORITE ? 1 : 0, id, APP_USER_ID]
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(_req, { params }) {
  try {
    const id = Number(params.id);
    await query("DELETE FROM knowledge_notes WHERE ID = ? AND USER_ID = ?", [id, APP_USER_ID]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
