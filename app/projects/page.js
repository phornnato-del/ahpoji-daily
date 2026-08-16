"use client";

import { useEffect, useState } from "react";
import Modal from "../components/Modal";

const emptyForm = {
  NAME: "",
  DESCRIPTION: "",
  TECHNOLOGY: "",
  STATUS: "1",
  START_DATE: "",
  END_DATE: "",
  PROGRESS: 0,
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [meta, setMeta] = useState({ categories: [], priorities: [], statuses: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [newTask, setNewTask] = useState({});

  async function loadAll() {
    setLoading(true);
    try {
      const [p, m] = await Promise.all([
        fetch("/api/projects").then(async (r) => {
          const data = await r.json().catch(() => ({}));
          if (!r.ok || data?.error) throw new Error(data?.error || "Failed to load projects");
          return data;
        }),
        fetch("/api/meta").then(async (r) => {
          const data = await r.json().catch(() => ({}));
          if (!r.ok || data?.error) throw new Error(data?.error || "Failed to load metadata");
          return data;
        }),
      ]);

      setProjects(Array.isArray(p) ? p : []);
      setMeta({
        categories: Array.isArray(m?.categories) ? m.categories : [],
        priorities: Array.isArray(m?.priorities) ? m.priorities : [],
        statuses: Array.isArray(m?.statuses) ? m.statuses : [],
      });
      setError(null);
    } catch (err) {
      setError(err.message);
      setProjects([]);
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

  function openEdit(p) {
    setEditing(p);
    setForm({
      NAME: p.NAME || "",
      DESCRIPTION: p.DESCRIPTION || "",
      TECHNOLOGY: p.TECHNOLOGY || "",
      STATUS: String(p.STATUS || "1"),
      START_DATE: p.START_DATE || "",
      END_DATE: p.END_DATE || "",
      PROGRESS: p.PROGRESS || 0,
    });
    setModalOpen(true);
  }

  async function submitForm(e) {
    e.preventDefault();
    const payload = {
      ...form,
      STATUS: form.STATUS || null,
      START_DATE: form.START_DATE || null,
      END_DATE: form.END_DATE || null,
      PROGRESS: Number(form.PROGRESS) || 0,
    };
    const url = editing ? `/api/projects/${editing.ID}` : "/api/projects";
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

  async function deleteProject(id) {
    if (!confirm("Delete this project and all of its tasks?")) return;
    await fetch(`/api/projects/${id}`, { method: "DELETE" });
    loadAll();
  }

  async function addTask(projectId) {
    const title = (newTask[projectId] || "").trim();
    if (!title) return;
    await fetch(`/api/projects/${projectId}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ TITLE: title }),
    });
    setNewTask((prev) => ({ ...prev, [projectId]: "" }));
    loadAll();
  }

  async function cycleTaskStatus(task) {
    // NOT_STARTED(1) -> IN_PROGRESS(2) -> COMPLETED(3) -> back to NOT_STARTED(1)
    const next = task.STATUS_ID === 3 ? 1 : (task.STATUS_ID || 1) + 1;
    await fetch(`/api/project-tasks/${task.ID}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ STATUS_ID: next }),
    });
    loadAll();
  }

  async function deleteTask(id) {
    await fetch(`/api/project-tasks/${id}`, { method: "DELETE" });
    loadAll();
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
        <div>
          <div className="stamp text-amber text-[11px] mb-2">02 · projects</div>
          <h1 className="font-display text-3xl text-paper">Projects</h1>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          + new project
        </button>
      </div>

      {error && <div className="paper-card border-l-4 border-brick px-5 py-3 mb-6 text-sm">{error}</div>}
      {loading && <p className="text-paper/50 text-sm">Loading…</p>}

      <div className="space-y-4">
        {!loading && projects.length === 0 && !error && (
          <p className="text-paper/50 text-sm">No projects yet — start your first build.</p>
        )}
        {projects.map((p) => (
          <div key={p.ID} className="paper-card p-5 animate-fadeUp">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h3 className="font-display text-xl">{p.NAME}</h3>
                <div className="stamp text-[10px] text-paper-text/50 mt-1">
                  {p.STATUS_TITLE || "no status"}
                  {p.TECHNOLOGY ? ` · ${p.TECHNOLOGY}` : ""}
                  {p.END_DATE ? ` · due ${p.END_DATE}` : ""}
                </div>
                {p.DESCRIPTION && <p className="text-sm mt-2 text-paper-text/80">{p.DESCRIPTION}</p>}
              </div>
              <div className="flex gap-2 shrink-0">
                <button className="btn btn-ghost" onClick={() => openEdit(p)}>
                  edit
                </button>
                <button className="btn btn-danger" onClick={() => deleteProject(p.ID)}>
                  delete
                </button>
              </div>
            </div>

            <div className="mt-3">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="stamp text-paper-text/50">progress</span>
                <span className="font-mono">{p.PROGRESS ?? 0}%</span>
              </div>
              <div className="h-1.5 bg-paper-dim rounded-full overflow-hidden">
                <div className="h-full bg-teal rounded-full" style={{ width: `${Math.min(p.PROGRESS ?? 0, 100)}%` }} />
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-paper-dim">
              <div className="stamp text-[10px] text-paper-text/50 mb-2">tasks (click status to cycle)</div>
              <div className="space-y-1.5">
                {(p.tasks || []).map((t) => (
                  <div key={t.ID} className="flex items-center gap-2 text-sm">
                    <button
                      onClick={() => cycleTaskStatus(t)}
                      className="stamp text-[9px] px-2 py-0.5 rounded-full border border-paper-text/20 hover:border-teal hover:text-teal"
                    >
                      {t.STATUS_TITLE || "NOT_STARTED"}
                    </button>
                    <span>{t.TITLE}</span>
                    {t.DUE_DATE && <span className="stamp text-[10px] text-paper-text/40">· {t.DUE_DATE}</span>}
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
                  value={newTask[p.ID] || ""}
                  onChange={(e) => setNewTask((prev) => ({ ...prev, [p.ID]: e.target.value }))}
                  onKeyDown={(e) => e.key === "Enter" && addTask(p.ID)}
                />
                <button className="btn btn-ghost !border-paper-text/20 !text-paper-text text-xs" onClick={() => addTask(p.ID)}>
                  add
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit project" : "New project"}>
        <form onSubmit={submitForm} className="space-y-3">
          <div>
            <label className="stamp text-[10px] text-paper-text/50">name *</label>
            <input
              className="field-input w-full !bg-white/50 !text-paper-text !border-paper-text/20"
              value={form.NAME}
              onChange={(e) => setForm({ ...form, NAME: e.target.value })}
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
          <div>
            <label className="stamp text-[10px] text-paper-text/50">technology</label>
            <input
              className="field-input w-full !bg-white/50 !text-paper-text !border-paper-text/20"
              placeholder="Next.js, MySQL, Tailwind…"
              value={form.TECHNOLOGY}
              onChange={(e) => setForm({ ...form, TECHNOLOGY: e.target.value })}
            />
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
              <label className="stamp text-[10px] text-paper-text/50">end date</label>
              <input
                type="date"
                className="field-input w-full !bg-white/50 !text-paper-text !border-paper-text/20"
                value={form.END_DATE || ""}
                onChange={(e) => setForm({ ...form, END_DATE: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="stamp text-[10px] text-paper-text/50">status</label>
              <select
                className="field-input w-full !bg-white/50 !text-paper-text !border-paper-text/20"
                value={form.STATUS}
                onChange={(e) => setForm({ ...form, STATUS: e.target.value })}
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
              {editing ? "save changes" : "create project"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
