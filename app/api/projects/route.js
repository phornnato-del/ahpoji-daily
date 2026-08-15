import { NextResponse } from "next/server";
import { query, APP_USER_ID } from "@/lib/db";

export async function GET() {
  try {
    const projects = await query(
      `SELECT p.*, s.TITLE AS STATUS_TITLE
       FROM projects p
       LEFT JOIN status s ON s.ID = p.STATUS
       WHERE p.USER_ID = ?
       ORDER BY p.CREATED_AT DESC, p.ID DESC`,
      [APP_USER_ID]
    );

    const tasks = await query(
      `SELECT pt.*, pr.TITLE AS PRIORITY_TITLE, s.TITLE AS STATUS_TITLE
       FROM project_tasks pt
       LEFT JOIN priority pr ON pr.ID = pt.PRIORITY_ID
       LEFT JOIN status s ON s.ID = pt.STATUS_ID
       WHERE pt.USER_ID = ?
       ORDER BY pt.DUE_DATE IS NULL, pt.DUE_DATE ASC`,
      [APP_USER_ID]
    );

    const projectsWithTasks = projects.map((p) => ({
      ...p,
      tasks: tasks.filter((t) => t.PROJECT_ID === p.ID),
    }));

    return NextResponse.json(projectsWithTasks);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      NAME,
      DESCRIPTION = null,
      TECHNOLOGY = null,
      STATUS = 1,
      START_DATE = null,
      END_DATE = null,
      PROGRESS = 0,
    } = body;

    if (!NAME || !NAME.trim()) {
      return NextResponse.json({ error: "NAME is required" }, { status: 400 });
    }

    const result = await query(
      `INSERT INTO projects
        (USER_ID, NAME, DESCRIPTION, TECHNOLOGY, STATUS, START_DATE, END_DATE, PROGRESS, CREATED_AT)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURDATE())`,
      [APP_USER_ID, NAME.trim(), DESCRIPTION, TECHNOLOGY, STATUS, START_DATE, END_DATE, PROGRESS]
    );

    return NextResponse.json({ id: result.insertId }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
