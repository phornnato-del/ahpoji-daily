"use client";

import { useEffect, useState } from "react";
import Modal from "../components/Modal";

const emptyForm = {
  TITLE: "",
  CONTENT: "",
  CATEGORY_ID: "",
  TAGS: "",
  FAVORITE: false,
};

export default function NotesPage() {
  const [notes, setNotes] = useState([]);
  const [meta, setMeta] = useState({ categories: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);

  async function loadAll() {
    setLoading(true);
    try {
      const [n, m] = await Promise.all([
        fetch("/api/notes").then((r) => r.json()),
        fetch("/api/meta").then((r) => r.json()),
      ]);
      if (n.error) throw new Error(n.error);
      setNotes(n);
      setMeta(m);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

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
      loadAll();
    } else {
      const data = await res.json();
      alert(data.error || "Something went wrong");
    }
  }

  async function deleteNote(id) {
    if (!confirm("Delete this note?")) return;
    await fetch(`/api/notes/${id}`, { method: "DELETE" });
    loadAll();
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
    loadAll();
  }

  const noteCategories = meta.categories.filter((c) => c.TYPE === "NOTE");

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
        <div>
          <div className="stamp text-amber text-[11px] mb-2">04 · notes</div>
          <h1 className="font-display text-3xl text-paper">Knowledge notes</h1>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          + new note
        </button>
      </div>

      {error && <div className="paper-card border-l-4 border-brick px-5 py-3 mb-6 text-sm">{error}</div>}
      {loading && <p className="text-paper/50 text-sm">Loading…</p>}

      <div className="grid sm:grid-cols-2 gap-4">
        {!loading && notes.length === 0 && !error && (
          <p className="text-paper/50 text-sm">No notes saved yet.</p>
        )}
        {notes.map((n) => (
          <div key={n.ID} className="paper-card p-5 animate-fadeUp flex flex-col">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-display text-lg leading-snug">{n.TITLE}</h3>
              <button
                onClick={() => toggleFavorite(n)}
                className={`text-lg leading-none ${n.FAVORITE ? "text-amber" : "text-paper-text/20 hover:text-amber"}`}
                aria-label="Toggle favorite"
              >
                ★
              </button>
            </div>
            <div className="stamp text-[10px] text-paper-text/50 mt-1">{n.CATEGORY_TITLE || "uncategorized"}</div>
            {n.CONTENT && <p className="text-sm mt-2 text-paper-text/80 flex-1">{n.CONTENT}</p>}
            {n.TAGS && (
              <div className="flex gap-1.5 flex-wrap mt-3">
                {n.TAGS.split(",").map((tag) => (
                  <span key={tag} className="stamp text-[9px] px-2 py-0.5 rounded-full bg-paper-dim">
                    {tag.trim()}
                  </span>
                ))}
              </div>
            )}
            <div className="flex gap-2 mt-4 pt-3 border-t border-paper-dim">
              <button className="btn btn-ghost !border-paper-text/20 !text-paper-text text-xs" onClick={() => openEdit(n)}>
                edit
              </button>
              <button className="btn btn-danger text-xs" onClick={() => deleteNote(n.ID)}>
                delete
              </button>
            </div>
          </div>
        ))}
      </div>

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
