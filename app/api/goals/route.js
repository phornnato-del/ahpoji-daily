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
      ? `AND (g.TITLE LIKE ? OR g.DESCRIPTION LIKE ? OR c.TITLE LIKE ? OR p.TITLE LIKE ? OR s.TITLE LIKE ?)`
      : "";
    const searchParamsForQuery = search ? [searchPattern, searchPattern, searchPattern, searchPattern, searchPattern] : [];

    const countRows = await query(
      `SELECT COUNT(*) AS TOTAL
       FROM goals g
       LEFT JOIN category c ON c.ID = g.CATEGORY_ID
       LEFT JOIN priority p ON p.ID = g.PRIORITY_ID
       LEFT JOIN status s ON s.ID = g.STATUS_ID
       WHERE g.USER_ID = ? ${searchSql}`,
      [APP_USER_ID, ...searchParamsForQuery]
    );
    const total = Number(countRows[0]?.TOTAL || 0);
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(page, totalPages);
    const offset = (safePage - 1) * pageSize;

    const goals = await query(
      `SELECT g.*, c.TITLE AS CATEGORY_TITLE, p.TITLE AS PRIORITY_TITLE, s.TITLE AS STATUS_TITLE
       FROM goals g
       LEFT JOIN category c ON c.ID = g.CATEGORY_ID
       LEFT JOIN priority p ON p.ID = g.PRIORITY_ID
       LEFT JOIN status s ON s.ID = g.STATUS_ID
       WHERE g.USER_ID = ? ${searchSql}
       ORDER BY g.CREATED_AT DESC, g.ID DESC
       LIMIT ? OFFSET ?`,
      [APP_USER_ID, ...searchParamsForQuery, pageSize, offset]
    );

    const goalIds = goals.map((goal) => goal.ID);
    const tasks = goalIds.length
      ? await query(
        `SELECT * FROM goal_tasks WHERE USER_ID = ? AND GOAL_ID IN (${goalIds.map(() => "?").join(",")})
         ORDER BY DUE_DATE IS NULL, DUE_DATE ASC`,
        [APP_USER_ID, ...goalIds]
      )
      : [];

    const goalsWithTasks = goals.map((g) => ({
      ...g,
      tasks: tasks.filter((t) => Number(t.GOAL_ID) === Number(g.ID)),
    }));

    return NextResponse.json({ items: goalsWithTasks, total, page: safePage, pageSize, totalPages });
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
