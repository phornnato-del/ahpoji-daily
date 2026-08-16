"use client";

import { useEffect, useState } from "react";
import Modal from "../components/Modal";

const emptyForm = {
  TITLE: "",
  DESCRIPTION: "",
  CATEGORY_ID: "",
  START_DATE: "",
  TARGET_DATE: "",
  PRIORITY_ID: "",
  STATUS_ID: "1",
  PROGRESS: 0,
};

export default function GoalsPage() {
  const [goals, setGoals] = useState([]);
  const [meta, setMeta] = useState({ categories: [], priorities: [], statuses: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [newTaskName, setNewTaskName] = useState({});

  async function loadAll() {
    setLoading(true);
    try {
      const [g, m] = await Promise.all([
        fetch("/api/goals").then(async (r) => {
          const data = await r.json().catch(() => ({}));
          if (!r.ok || data?.error) throw new Error(data?.error || "Failed to load goals");
          return data;
        }),
        fetch("/api/meta").then(async (r) => {
          const data = await r.json().catch(() => ({}));
          if (!r.ok || data?.error) throw new Error(data?.error || "Failed to load metadata");
          return data;
        }),
      ]);

      setGoals(Array.isArray(g) ? g : []);
      setMeta({
        categories: Array.isArray(m?.categories) ? m.categories : [],
        priorities: Array.isArray(m?.priorities) ? m.priorities : [],
        statuses: Array.isArray(m?.statuses) ? m.statuses : [],
      });
      setError(null);
    } catch (err) {
      setError(err.message);
      setGoals([]);
      setMeta({ categories: [], priorities: [], statuses: [] });
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

  function openEdit(g) {
    setEditing(g);
    setForm({
      TITLE: g.TITLE || "",
      DESCRIPTION: g.DESCRIPTION || "",
      CATEGORY_ID: g.CATEGORY_ID || "",
      START_DATE: g.START_DATE || "",
      TARGET_DATE: g.TARGET_DATE || "",
      PRIORITY_ID: g.PRIORITY_ID || "",
      STATUS_ID: String(g.STATUS_ID || "1"),
      PROGRESS: g.PROGRESS || 0,
    });
    setModalOpen(true);
  }

  async function submitForm(e) {
    e.preventDefault();
    const payload = {
      ...form,
      CATEGORY_ID: form.CATEGORY_ID || null,
      PRIORITY_ID: form.PRIORITY_ID || null,
      STATUS_ID: form.STATUS_ID || null,
      START_DATE: form.START_DATE || null,
      TARGET_DATE: form.TARGET_DATE || null,
      PROGRESS: Number(form.PROGRESS) || 0,
    };
    const url = editing ? `/api/goals/${editing.ID}` : "/api/goals";
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

  async function deleteGoal(id) {
    if (!confirm("Delete this goal and all of its tasks?")) return;
    await fetch(`/api/goals/${id}`, { method: "DELETE" });
    loadAll();
  }

  async function addTask(goalId) {
    const name = (newTaskName[goalId] || "").trim();
    if (!name) return;
    await fetch(`/api/goals/${goalId}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ TASK_NAME: name }),
    });
    setNewTaskName((prev) => ({ ...prev, [goalId]: "" }));
    loadAll();
  }

  async function toggleTask(task) {
    await fetch(`/api/goal-tasks/${task.ID}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ COMPLETED: task.COMPLETED ? 0 : 1 }),
    });
    loadAll();
  }

  async function deleteTask(id) {
    await fetch(`/api/goal-tasks/${id}`, { method: "DELETE" });
    loadAll();
  }

  const goalCategories = meta.categories.filter((c) => c.TYPE === "GOAL");

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
        <div>
          <div className="stamp text-amber text-[11px] mb-2">01 · goals</div>
          <h1 className="font-display text-3xl text-paper">Goals</h1>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          + new goal
        </button>
      </div>

      {error && (
        <div className="paper-card border-l-4 border-brick px-5 py-3 mb-6 text-sm">{error}</div>
      )}
      {loading && <p className="text-paper/50 text-sm">Loading…</p>}

      <div className="space-y-4">
        {!loading && goals.length === 0 && !error && (
          <p className="text-paper/50 text-sm">No goals yet — log your first one.</p>
        )}
        {goals.map((g) => (
          <div key={g.ID} className="paper-card p-5 animate-fadeUp">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-display text-xl">{g.TITLE}</h3>
                  {g.PRIORITY_TITLE && (
                    <span className="stamp text-[10px] px-2 py-0.5 rounded-full border border-paper-text/20">
                      {g.PRIORITY_TITLE}
                    </span>
                  )}
                </div>
                <div className="stamp text-[10px] text-paper-text/50 mt-1">
                  {g.CATEGORY_TITLE || "uncategorized"} · {g.STATUS_TITLE || "no status"}
                  {g.TARGET_DATE ? ` · due ${g.TARGET_DATE}` : ""}
                </div>
                {g.DESCRIPTION && <p className="text-sm mt-2 text-paper-text/80">{g.DESCRIPTION}</p>}
              </div>
              <div className="flex gap-2 shrink-0">
                <button className="btn btn-ghost" onClick={() => openEdit(g)}>
                  edit
                </button>
                <button className="btn btn-danger" onClick={() => deleteGoal(g.ID)}>
                  delete
                </button>
              </div>
            </div>

            <div className="mt-3">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="stamp text-paper-text/50">progress</span>
                <span className="font-mono">{g.PROGRESS ?? 0}%</span>
              </div>
              <div className="h-1.5 bg-paper-dim rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber rounded-full"
                  style={{ width: `${Math.min(g.PROGRESS ?? 0, 100)}%` }}
                />
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-paper-dim">
              <div className="stamp text-[10px] text-paper-text/50 mb-2">tasks</div>
              <div className="space-y-1.5">
                {(g.tasks || []).map((t) => (
                  <div key={t.ID} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={!!t.COMPLETED}
                      onChange={() => toggleTask(t)}
                      className="accent-amber-dark"
                    />
                    <span className={t.COMPLETED ? "line-through text-paper-text/40" : ""}>
                      {t.TASK_NAME}
                    </span>
                    {t.DUE_DATE && (
                      <span className="stamp text-[10px] text-paper-text/40">· {t.DUE_DATE}</span>
                    )}
                    <button
                      onClick={() => deleteTask(t.ID)}
                      className="ml-auto text-paper-text/30 hover:text-brick text-xs"
                    >
                      remove
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-3">
                <input
                  className="field-input flex-1 !bg-white/40 !text-paper-text !border-paper-text/20 text-sm"
                  placeholder="add a task…"
                  value={newTaskName[g.ID] || ""}
                  onChange={(e) => setNewTaskName((prev) => ({ ...prev, [g.ID]: e.target.value }))}
                  onKeyDown={(e) => e.key === "Enter" && addTask(g.ID)}
                />
                <button className="btn btn-ghost !border-paper-text/20 !text-paper-text text-xs" onClick={() => addTask(g.ID)}>
                  add
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit goal" : "New goal"}>
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
            <label className="stamp text-[10px] text-paper-text/50">description</label>
            <textarea
              className="field-input w-full !bg-white/50 !text-paper-text !border-paper-text/20"
              rows={3}
              value={form.DESCRIPTION}
              onChange={(e) => setForm({ ...form, DESCRIPTION: e.target.value })}
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
                {goalCategories.map((c) => (
                  <option key={c.ID} value={c.ID}>
                    {c.TITLE}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="stamp text-[10px] text-paper-text/50">priority</label>
              <select
                className="field-input w-full !bg-white/50 !text-paper-text !border-paper-text/20"
                value={form.PRIORITY_ID}
                onChange={(e) => setForm({ ...form, PRIORITY_ID: e.target.value })}
              >
                <option value="">—</option>
                {meta.priorities.map((p) => (
                  <option key={p.ID} value={p.ID}>
                    {p.TITLE}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="stamp text-[10px] text-paper-text/50">start date</label>
              <input
                type="date"
                className="field-input w-full !bg-white/50 !text-paper-text !border-paper-text/20"
                value={form.START_DATE || ""}
                onChange={(e) => setForm({ ...form, START_DATE: e.target.value })}
              />
            </div>
            <div>
              <label className="stamp text-[10px] text-paper-text/50">target date</label>
              <input
                type="date"
                className="field-input w-full !bg-white/50 !text-paper-text !border-paper-text/20"
                value={form.TARGET_DATE || ""}
                onChange={(e) => setForm({ ...form, TARGET_DATE: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="stamp text-[10px] text-paper-text/50">status</label>
              <select
                className="field-input w-full !bg-white/50 !text-paper-text !border-paper-text/20"
                value={form.STATUS_ID}
                onChange={(e) => setForm({ ...form, STATUS_ID: e.target.value })}
              >
                {meta.statuses.map((s) => (
                  <option key={s.ID} value={s.ID}>
                    {s.TITLE}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="stamp text-[10px] text-paper-text/50">progress %</label>
              <input
                type="number"
                min="0"
                max="100"
                className="field-input w-full !bg-white/50 !text-paper-text !border-paper-text/20"
                value={form.PROGRESS}
                onChange={(e) => setForm({ ...form, PROGRESS: e.target.value })}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn btn-ghost !border-paper-text/20 !text-paper-text" onClick={() => setModalOpen(false)}>
              cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {editing ? "save changes" : "create goal"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
