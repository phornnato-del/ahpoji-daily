import { NextResponse } from "next/server";
import { query, APP_USER_ID } from "@/lib/db";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const requestedPage = Number(searchParams.get("page") || 1);
    const requestedPageSize = Number(searchParams.get("pageSize") || 5);
    const page = Number.isFinite(requestedPage) && requestedPage > 0 ? Math.floor(requestedPage) : 1;
    const pageSize = [5, 10, 20, 50].includes(requestedPageSize) ? requestedPageSize : 5;
    const search = (searchParams.get("search") || "").trim();
    const searchPattern = `%${search}%`;
    const searchSql = search
      ? "AND (p.NAME LIKE ? OR p.DESCRIPTION LIKE ? OR p.TECHNOLOGY LIKE ? OR s.TITLE LIKE ?)"
      : "";
    const searchValues = search ? [searchPattern, searchPattern, searchPattern, searchPattern] : [];
    const countRows = await query(
      `SELECT COUNT(*) AS TOTAL FROM projects p LEFT JOIN status s ON s.ID = p.STATUS
       WHERE p.USER_ID = ? ${searchSql}`,
      [APP_USER_ID, ...searchValues]
    );
    const total = Number(countRows[0]?.TOTAL || 0);
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(page, totalPages);
    const offset = (safePage - 1) * pageSize;

    const projects = await query(
      `SELECT p.*, s.TITLE AS STATUS_TITLE
       FROM projects p
       LEFT JOIN status s ON s.ID = p.STATUS
       WHERE p.USER_ID = ? ${searchSql}
       ORDER BY p.CREATED_AT DESC, p.ID DESC
       LIMIT ? OFFSET ?`,
      [APP_USER_ID, ...searchValues, pageSize, offset]
    );

    const projectIds = projects.map((project) => project.ID);
    const tasks = projectIds.length
      ? await query(
        `SELECT pt.*, pr.TITLE AS PRIORITY_TITLE, s.TITLE AS STATUS_TITLE
         FROM project_tasks pt
         LEFT JOIN priority pr ON pr.ID = pt.PRIORITY_ID
         LEFT JOIN status s ON s.ID = pt.STATUS_ID
         WHERE pt.USER_ID = ? AND pt.PROJECT_ID IN (${projectIds.map(() => "?").join(",")})
         ORDER BY pt.DUE_DATE IS NULL, pt.DUE_DATE ASC`,
        [APP_USER_ID, ...projectIds]
      )
      : [];

    const projectsWithTasks = projects.map((p) => ({
      ...p,
      tasks: tasks.filter((t) => Number(t.PROJECT_ID) === Number(p.ID)),
    }));

    return NextResponse.json({ items: projectsWithTasks, total, page: safePage, pageSize, totalPages });
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
