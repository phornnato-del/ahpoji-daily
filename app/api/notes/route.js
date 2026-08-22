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
    const searchSql = search ? "AND (n.TITLE LIKE ? OR n.CONTENT LIKE ? OR n.TAGS LIKE ? OR c.TITLE LIKE ?)" : "";
    const searchValues = search ? [pattern, pattern, pattern, pattern] : [];
    const countRows = await query(
      `SELECT COUNT(*) AS TOTAL FROM knowledge_notes n LEFT JOIN category c ON c.ID = n.CATEGORY_ID
       WHERE n.USER_ID = ? ${searchSql}`,
      [APP_USER_ID, ...searchValues]
    );
    const total = Number(countRows[0]?.TOTAL || 0);
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(page, totalPages);
    const notes = await query(
      `SELECT n.*, c.TITLE AS CATEGORY_TITLE
       FROM knowledge_notes n
       LEFT JOIN category c ON c.ID = n.CATEGORY_ID
       WHERE n.USER_ID = ? ${searchSql}
       ORDER BY n.FAVORITE DESC, n.CREATED_AT DESC, n.ID DESC
       LIMIT ? OFFSET ?`,
      [APP_USER_ID, ...searchValues, pageSize, (safePage - 1) * pageSize]
    );
    return NextResponse.json({ items: notes, total, page: safePage, pageSize, totalPages });
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
