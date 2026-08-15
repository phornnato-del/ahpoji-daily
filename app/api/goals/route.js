import { NextResponse } from "next/server";
import { query, APP_USER_ID } from "@/lib/db";

export async function GET() {
  try {
    const goals = await query(
      `SELECT g.*, c.TITLE AS CATEGORY_TITLE, p.TITLE AS PRIORITY_TITLE, s.TITLE AS STATUS_TITLE
       FROM goals g
       LEFT JOIN category c ON c.ID = g.CATEGORY_ID
       LEFT JOIN priority p ON p.ID = g.PRIORITY_ID
       LEFT JOIN status s ON s.ID = g.STATUS_ID
       WHERE g.USER_ID = ?
       ORDER BY g.CREATED_AT DESC, g.ID DESC`,
      [APP_USER_ID]
    );

    const tasks = await query(
      `SELECT * FROM goal_tasks WHERE USER_ID = ? ORDER BY DUE_DATE IS NULL, DUE_DATE ASC`,
      [APP_USER_ID]
    );

    const goalsWithTasks = goals.map((g) => ({
      ...g,
      tasks: tasks.filter((t) => t.GOAL_ID === g.ID),
    }));

    return NextResponse.json(goalsWithTasks);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      TITLE,
      DESCRIPTION = null,
      CATEGORY_ID = null,
      START_DATE = null,
      TARGET_DATE = null,
      PRIORITY_ID = null,
      STATUS_ID = 1,
      PROGRESS = 0,
    } = body;

    if (!TITLE || !TITLE.trim()) {
      return NextResponse.json({ error: "TITLE is required" }, { status: 400 });
    }

    const result = await query(
      `INSERT INTO goals
        (USER_ID, TITLE, DESCRIPTION, CATEGORY_ID, START_DATE, TARGET_DATE, PRIORITY_ID, STATUS_ID, PROGRESS, CREATED_AT)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURDATE())`,
      [APP_USER_ID, TITLE.trim(), DESCRIPTION, CATEGORY_ID, START_DATE, TARGET_DATE, PRIORITY_ID, STATUS_ID, PROGRESS]
    );

    return NextResponse.json({ id: result.insertId }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
