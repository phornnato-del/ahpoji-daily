"use client";

import { useEffect, useState } from "react";
import Modal from "../components/Modal";

const emptyForm = {
  ACTIVITY_NAME: "",
  CATEGORY_ID: "",
  DURATION_MINUTES: "",
  ACTIVITY_DATE: "",
  NOTE: "",
};

export default function ActivitiesPage() {
  const [activities, setActivities] = useState([]);
  const [meta, setMeta] = useState({ categories: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);

  async function loadAll() {
    setLoading(true);
    try {
      const [a, m] = await Promise.all([
        fetch("/api/activities").then((r) => r.json()),
        fetch("/api/meta").then((r) => r.json()),
      ]);
      if (a.error) throw new Error(a.error);
      setActivities(a);
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
    setForm({ ...emptyForm, ACTIVITY_DATE: new Date().toISOString().slice(0, 10) });
    setModalOpen(true);
  }

  function openEdit(a) {
    setEditing(a);
    setForm({
      ACTIVITY_NAME: a.ACTIVITY_NAME || "",
      CATEGORY_ID: a.CATEGORY_ID || "",
      DURATION_MINUTES: a.DURATION_MINUTES ?? "",
      ACTIVITY_DATE: a.ACTIVITY_DATE || "",
      NOTE: a.NOTE || "",
    });
    setModalOpen(true);
  }

  async function submitForm(e) {
    e.preventDefault();
    const payload = {
      ...form,
      CATEGORY_ID: form.CATEGORY_ID || null,
      DURATION_MINUTES: form.DURATION_MINUTES === "" ? null : Number(form.DURATION_MINUTES),
      ACTIVITY_DATE: form.ACTIVITY_DATE || null,
    };
    const url = editing ? `/api/activities/${editing.ID}` : "/api/activities";
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

  async function deleteActivity(id) {
    if (!confirm("Delete this activity entry?")) return;
    await fetch(`/api/activities/${id}`, { method: "DELETE" });
    loadAll();
  }

  const activityCategories = meta.categories.filter((c) => c.TYPE === "ACTIVITY");

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
        <div>
          <div className="stamp text-amber text-[11px] mb-2">03 · activities</div>
          <h1 className="font-display text-3xl text-paper">Activity log</h1>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          + log activity
        </button>
      </div>

      {error && <div className="paper-card border-l-4 border-brick px-5 py-3 mb-6 text-sm">{error}</div>}
      {loading && <p className="text-paper/50 text-sm">Loading…</p>}

      <div className="paper-card overflow-hidden">
        {!loading && activities.length === 0 && !error && (
          <p className="text-paper-text/50 text-sm p-5">Nothing logged yet.</p>
        )}
        {activities.map((a, idx) => (
          <div
            key={a.ID}
            className={`flex items-center justify-between gap-4 px-5 py-3 flex-wrap ${
              idx !== activities.length - 1 ? "border-b border-paper-dim" : ""
            }`}
          >
            <div className="min-w-0">
              <div className="text-sm font-medium">{a.ACTIVITY_NAME}</div>
              <div className="stamp text-[10px] text-paper-text/50 mt-0.5">
                {a.ACTIVITY_DATE || "no date"} · {a.CATEGORY_TITLE || "uncategorized"}
              </div>
              {a.NOTE && <p className="text-xs text-paper-text/70 mt-1">{a.NOTE}</p>}
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="font-mono text-xs text-paper-text/70">
                {a.DURATION_MINUTES ? `${a.DURATION_MINUTES}m` : "—"}
              </span>
              <button className="btn btn-ghost !border-paper-text/20 !text-paper-text text-xs" onClick={() => openEdit(a)}>
                edit
              </button>
              <button className="btn btn-danger text-xs" onClick={() => deleteActivity(a.ID)}>
                delete
              </button>
            </div>
          </div>
        ))}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit activity" : "Log activity"}>
        <form onSubmit={submitForm} className="space-y-3">
          <div>
            <label className="stamp text-[10px] text-paper-text/50">activity *</label>
            <input
              className="field-input w-full !bg-white/50 !text-paper-text !border-paper-text/20"
              value={form.ACTIVITY_NAME}
              onChange={(e) => setForm({ ...form, ACTIVITY_NAME: e.target.value })}
              required
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
                {activityCategories.map((c) => (
                  <option key={c.ID} value={c.ID}>
                    {c.TITLE}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="stamp text-[10px] text-paper-text/50">duration (minutes)</label>
              <input
                type="number"
                min="0"
                className="field-input w-full !bg-white/50 !text-paper-text !border-paper-text/20"
                value={form.DURATION_MINUTES}
                onChange={(e) => setForm({ ...form, DURATION_MINUTES: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="stamp text-[10px] text-paper-text/50">date</label>
            <input
              type="date"
              className="field-input w-full !bg-white/50 !text-paper-text !border-paper-text/20"
              value={form.ACTIVITY_DATE || ""}
              onChange={(e) => setForm({ ...form, ACTIVITY_DATE: e.target.value })}
            />
          </div>
          <div>
            <label className="stamp text-[10px] text-paper-text/50">note</label>
            <textarea
              className="field-input w-full !bg-white/50 !text-paper-text !border-paper-text/20"
              rows={2}
              value={form.NOTE}
              onChange={(e) => setForm({ ...form, NOTE: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn btn-ghost !border-paper-text/20 !text-paper-text" onClick={() => setModalOpen(false)}>
              cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {editing ? "save changes" : "log activity"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
