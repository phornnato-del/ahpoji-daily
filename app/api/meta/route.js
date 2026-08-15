import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  try {
    const [categories, priorities, statuses] = await Promise.all([
      query("SELECT ID, TITLE, DESCRIPTION, TYPE FROM category ORDER BY TYPE, TITLE"),
      query("SELECT ID, TITLE, DESCRIPTION FROM priority ORDER BY ID"),
      query("SELECT ID, TITLE, DESCRIPTION FROM status ORDER BY ID"),
    ]);
    return NextResponse.json({ categories, priorities, statuses });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
