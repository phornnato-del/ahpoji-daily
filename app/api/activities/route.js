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
    const pattern = `%${search}%`;
    const searchSql = search ? "AND (a.ACTIVITY_NAME LIKE ? OR a.NOTE LIKE ? OR c.TITLE LIKE ?)" : "";
    const searchValues = search ? [pattern, pattern, pattern] : [];
    const countRows = await query(
      `SELECT COUNT(*) AS TOTAL FROM activities a LEFT JOIN category c ON c.ID = a.CATEGORY_ID
       WHERE a.USER_ID = ? ${searchSql}`,
      [APP_USER_ID, ...searchValues]
    );
    const total = Number(countRows[0]?.TOTAL || 0);
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(page, totalPages);

    const activities = await query(
      `SELECT a.*, c.TITLE AS CATEGORY_TITLE
       FROM activities a
       LEFT JOIN category c ON c.ID = a.CATEGORY_ID
       WHERE a.USER_ID = ? ${searchSql}
       ORDER BY a.ACTIVITY_DATE DESC, a.ID DESC
       LIMIT ? OFFSET ?`,
      [APP_USER_ID, ...searchValues, pageSize, (safePage - 1) * pageSize]
    );
    return NextResponse.json({ items: activities, total, page: safePage, pageSize, totalPages });
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
