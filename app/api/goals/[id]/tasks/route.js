import { NextResponse } from "next/server";
import { query, APP_USER_ID } from "@/lib/db";

export async function POST(req, { params }) {
  try {
    const goalId = Number(params.id);
    const body = await req.json();
    const { TASK_NAME, DUE_DATE = null } = body;

    if (!TASK_NAME || !TASK_NAME.trim()) {
      return NextResponse.json({ error: "TASK_NAME is required" }, { status: 400 });
    }

    const result = await query(
      `INSERT INTO goal_tasks (USER_ID, GOAL_ID, TASK_NAME, COMPLETED, DUE_DATE, CREATED_AT)
       VALUES (?, ?, ?, 0, ?, CURDATE())`,
      [APP_USER_ID, goalId, TASK_NAME.trim(), DUE_DATE]
    );

    return NextResponse.json({ id: result.insertId }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
