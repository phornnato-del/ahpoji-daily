import { NextResponse } from "next/server";
import { query, APP_USER_ID } from "@/lib/db";

export async function GET() {
  try {
    const activities = await query(
      `SELECT a.*, c.TITLE AS CATEGORY_TITLE
       FROM activities a
       LEFT JOIN category c ON c.ID = a.CATEGORY_ID
       WHERE a.USER_ID = ?
       ORDER BY a.ACTIVITY_DATE DESC, a.ID DESC`,
      [APP_USER_ID]
    );
    return NextResponse.json(activities);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { ACTIVITY_NAME, CATEGORY_ID = null, DURATION_MINUTES = null, ACTIVITY_DATE = null, NOTE = null } = body;

    if (!ACTIVITY_NAME || !ACTIVITY_NAME.trim()) {
      return NextResponse.json({ error: "ACTIVITY_NAME is required" }, { status: 400 });
    }

    const result = await query(
      `INSERT INTO activities (USER_ID, ACTIVITY_NAME, CATEGORY_ID, DURATION_MINUTES, ACTIVITY_DATE, NOTE, CREATED_AT)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [APP_USER_ID, ACTIVITY_NAME.trim(), CATEGORY_ID, DURATION_MINUTES, ACTIVITY_DATE, NOTE]
    );

    return NextResponse.json({ id: result.insertId }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
