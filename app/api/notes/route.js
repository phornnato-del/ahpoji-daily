import { NextResponse } from "next/server";
import { query, APP_USER_ID } from "@/lib/db";

export async function GET() {
  try {
    const notes = await query(
      `SELECT n.*, c.TITLE AS CATEGORY_TITLE
       FROM knowledge_notes n
       LEFT JOIN category c ON c.ID = n.CATEGORY_ID
       WHERE n.USER_ID = ?
       ORDER BY n.FAVORITE DESC, n.CREATED_AT DESC, n.ID DESC`,
      [APP_USER_ID]
    );
    return NextResponse.json(notes);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { TITLE, CONTENT = null, CATEGORY_ID = null, TAGS = null, FAVORITE = 0 } = body;

    if (!TITLE || !TITLE.trim()) {
      return NextResponse.json({ error: "TITLE is required" }, { status: 400 });
    }

    const result = await query(
      `INSERT INTO knowledge_notes (USER_ID, TITLE, CONTENT, CATEGORY_ID, TAGS, FAVORITE, CREATED_AT)
       VALUES (?, ?, ?, ?, ?, ?, CURDATE())`,
      [APP_USER_ID, TITLE.trim(), CONTENT, CATEGORY_ID, TAGS, FAVORITE ? 1 : 0]
    );

    return NextResponse.json({ id: result.insertId }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
