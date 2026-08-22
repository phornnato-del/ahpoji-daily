"use client";

import { useEffect, useState } from "react";
import { flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import Modal from "../components/Modal";

const emptyForm = {
  TITLE: "",
  CONTENT: "",
  CATEGORY_ID: "",
  TAGS: "",
  FAVORITE: false,
};

const notesCache = new Map();
let noteMetaCache = null;

function Icon({ name }) {
  const paths = {
    eye: <><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" /><circle cx="12" cy="12" r="2.5" /></>,
    edit: <><path d="m4 16-.7 3.7L7 19l11-11-3-3L4 16Z" /><path d="m13.5 6.5 3 3" /></>,
    trash: <><path d="M4 7h16M10 11v5M14 11v5" /><path d="m6 7 1 13h10l1-13M9 7V4h6v3" /></>,
  };
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">{paths[name]}</svg>;
}

export default function NotesPage() {
  const [notes, setNotes] = useState([]);
  const [meta, setMeta] = useState({ categories: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailNote, setDetailNote] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 5 });
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  async function loadNotes() {
    const cacheKey = `${search}|${pagination.pageIndex}|${pagination.pageSize}`;
    const cached = notesCache.get(cacheKey);
    if (cached) {
      setNotes(cached.items);
      setTotal(cached.total);
      setTotalPages(cached.totalPages);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(pagination.pageIndex + 1), pageSize: String(pagination.pageSize), search });
      const response = await fetch(`/api/notes?${params}`);
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data?.error) throw new Error(data?.error || "Failed to load notes");
      const items = Array.isArray(data.items) ? data.items : [];
      const nextTotal = Number(data.total || 0);
      const nextTotalPages = Number(data.totalPages || 1);
      setNotes(items);
      setTotal(nextTotal);
      setTotalPages(nextTotalPages);
      notesCache.set(cacheKey, { items, total: nextTotal, totalPages: nextTotalPages });
      setError(null);
    } catch (err) {
      setError(err.message);
      setNotes([]);
      setTotal(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNotes();
  }, [pagination.pageIndex, pagination.pageSize, search]);

  useEffect(() => {
    if (noteMetaCache) {
      setMeta(noteMetaCache);
      return;
    }
    fetch("/api/meta").then((response) => response.json()).then((data) => {
      const nextMeta = { categories: Array.isArray(data?.categories) ? data.categories : [], priorities: [], statuses: [] };
      noteMetaCache = nextMeta;
      setMeta(nextMeta);
    }).catch(() => setMeta({ categories: [], priorities: [], statuses: [] }));
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPagination((current) => ({ ...current, pageIndex: 0 }));
      setSearch(searchInput.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(n) {
    setEditing(n);
    setForm({
      TITLE: n.TITLE || "",
      CONTENT: n.CONTENT || "",
      CATEGORY_ID: n.CATEGORY_ID || "",
      TAGS: n.TAGS || "",
      FAVORITE: !!n.FAVORITE,
    });
    setModalOpen(true);
  }

  function openDetails(n) {
    setDetailNote(n);
  }

  async function submitForm(e) {
    e.preventDefault();
    const payload = { ...form, CATEGORY_ID: form.CATEGORY_ID || null };
    const url = editing ? `/api/notes/${editing.ID}` : "/api/notes";
    const method = editing ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      setModalOpen(false);
      notesCache.clear();
      loadNotes();
    } else {
      const data = await res.json();
      alert(data.error || "Something went wrong");
    }
  }

  async function deleteNote(id) {
    if (!confirm("Delete this note?")) return;
    await fetch(`/api/notes/${id}`, { method: "DELETE" });
    notesCache.clear();
    loadNotes();
  }

  async function toggleFavorite(n) {
    await fetch(`/api/notes/${n.ID}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        TITLE: n.TITLE,
        CONTENT: n.CONTENT,
        CATEGORY_ID: n.CATEGORY_ID,
        TAGS: n.TAGS,
        FAVORITE: n.FAVORITE ? 0 : 1,
      }),
    });
    notesCache.clear();
    loadNotes();
  }

  const noteCategories = meta.categories.filter((c) => c.TYPE === "NOTE");
  const columns = [
    {
      accessorKey: "TITLE",
      header: "Note",
      cell: ({ row }) => <div className="min-w-56"><div className="text-lg font-display">{row.original.TITLE}</div>{row.original.CONTENT && <p className="mt-1 text-xs text-paper-text/60">{row.original.CONTENT}</p>}</div>,
    },
    {
      id: "details",
      header: "Details",
      cell: ({ row }) => <div className="text-xs min-w-44 stamp text-paper-text/60"><div>{row.original.CATEGORY_TITLE || "uncategorized"}</div>{row.original.TAGS && <div className="mt-1">{row.original.TAGS}</div>}</div>,
    },
    {
      id: "favorite",
      header: "Favorite",
      cell: ({ row }) => <button onClick={() => toggleFavorite(row.original)} className={`text-lg leading-none ${Number(row.original.FAVORITE) === 1 ? "text-amber" : "text-paper-text/20 hover:text-amber"}`} aria-label="Toggle favorite">★</button>,
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => <div className="flex gap-1"><button className="btn btn-ghost !px-2 !text-paper-text" title="View note details" aria-label="View note details" onClick={() => openDetails(row.original)}><Icon name="eye" /></button><button className="btn btn-ghost !px-2 !text-paper-text" title="Edit note" aria-label="Edit note" onClick={() => openEdit(row.original)}><Icon name="edit" /></button><button className="btn btn-danger !px-2" title="Delete note" aria-label="Delete note" onClick={() => deleteNote(row.original.ID)}><Icon name="trash" /></button></div>,
    },
  ];
  const table = useReactTable({ data: notes, columns, getCoreRowModel: getCoreRowModel(), manualPagination: true, pageCount: totalPages, state: { pagination }, onPaginationChange: setPagination });

  return (
    <div className="w-full max-w-none">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
        <div>
          <div className="stamp text-amber text-[11px] mb-2">04 · notes</div>
          <h1 className="text-3xl font-display text-paper">Knowledge notes</h1>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          + new note
        </button>
      </div>

      {error && <div className="px-5 py-3 mb-6 text-sm border-l-4 paper-card border-brick">{error}</div>}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4"><input className="field-input w-full max-w-sm !bg-white/10" placeholder="search notes" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} /><label className="flex items-center gap-2 text-xs text-paper/60">rows<select className="field-input !bg-white/10" value={pagination.pageSize} onChange={(event) => setPagination({ pageIndex: 0, pageSize: Number(event.target.value) })}>{[5, 10, 20, 50].map((size) => <option key={size} value={size}>{size}</option>)}</select></label></div>
        <div className="overflow-x-auto paper-card glass-table"><table className="w-full min-w-[760px] text-left"><thead className="border-b border-paper-text/15">{table.getHeaderGroups().map((group) => <tr key={group.id}>{group.headers.map((header) => <th key={header.id} className="px-4 py-3 text-[10px] stamp text-paper-text/50">{flexRender(header.column.columnDef.header, header.getContext())}</th>)}</tr>)}</thead><tbody>{!loading && notes.length === 0 && <tr><td colSpan={columns.length} className="px-4 py-8 text-sm text-paper-text/60">{search ? "No matching notes." : "No notes saved yet."}</td></tr>}{table.getRowModel().rows.map((row) => <tr key={row.id} className="align-top border-b border-paper-text/10 last:border-0 animate-fadeUp">{row.getVisibleCells().map((cell) => <td key={cell.id} className="px-4 py-4">{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>)}</tr>)}</tbody></table></div>
      <div className="flex items-center justify-between gap-3 mt-4 text-xs text-paper/60"><span>{total === 0 ? "0" : `${pagination.pageIndex * pagination.pageSize + 1}-${Math.min((pagination.pageIndex + 1) * pagination.pageSize, total)} of ${total}`}</span><div className="flex gap-2"><button className="text-xs btn btn-ghost" disabled={pagination.pageIndex === 0 || loading} onClick={() => table.previousPage()}>previous</button><button className="text-xs btn btn-ghost" disabled={pagination.pageIndex >= totalPages - 1 || loading} onClick={() => table.nextPage()}>next</button></div></div>

      <Modal open={!!detailNote} onClose={() => setDetailNote(null)} title="Note details">{detailNote && <div className="space-y-4"><h2 className="text-2xl font-display">{detailNote.TITLE}</h2><p className="text-sm text-paper-text/70">{detailNote.CONTENT || "No content added."}</p><div className="grid grid-cols-2 gap-3 text-xs"><div><div className="stamp text-[10px] text-paper-text/50">category</div>{detailNote.CATEGORY_TITLE || "uncategorized"}</div><div><div className="stamp text-[10px] text-paper-text/50">favorite</div>{Number(detailNote.FAVORITE) === 1 ? "yes" : "no"}</div><div><div className="stamp text-[10px] text-paper-text/50">tags</div>{detailNote.TAGS || "none"}</div></div></div>}</Modal>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit note" : "New note"}>
        <form onSubmit={submitForm} className="space-y-3">
          <div>
            <label className="stamp text-[10px] text-paper-text/50">title *</label>
            <input
              className="field-input w-full !bg-white/50 !text-paper-text !border-paper-text/20"
              value={form.TITLE}
              onChange={(e) => setForm({ ...form, TITLE: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="stamp text-[10px] text-paper-text/50">content</label>
            <textarea
              className="field-input w-full !bg-white/50 !text-paper-text !border-paper-text/20"
              rows={4}
              value={form.CONTENT}
              onChange={(e) => setForm({ ...form, CONTENT: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="stamp text-[10px] text-paper-text/50">category</label>
              <select
                className="field-input w-full !bg-white/50 !text-paper-text !border-paper-text/20"
                value={form.CATEGORY_ID}
                onChange={(e) => setForm({ ...form, CATEGORY_ID: e.target.value })}
              >
                <option value="">—</option>
                {noteCategories.map((c) => (
                  <option key={c.ID} value={c.ID}>
                    {c.TITLE}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="stamp text-[10px] text-paper-text/50">tags (comma separated)</label>
              <input
                className="field-input w-full !bg-white/50 !text-paper-text !border-paper-text/20"
                value={form.TAGS}
                onChange={(e) => setForm({ ...form, TAGS: e.target.value })}
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.FAVORITE}
              onChange={(e) => setForm({ ...form, FAVORITE: e.target.checked })}
              className="accent-amber-dark"
            />
            mark as favorite
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn btn-ghost !border-paper-text/20 !text-paper-text" onClick={() => setModalOpen(false)}>
              cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {editing ? "save changes" : "create note"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
