"use client";

import { useEffect, useState } from "react";
import { flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
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

const projectsCache = new Map();
let projectMetaCache = null;

function Icon({ name }) {
  const paths = {
    eye: <><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" /><circle cx="12" cy="12" r="2.5" /></>,
    edit: <><path d="m4 16-.7 3.7L7 19l11-11-3-3L4 16Z" /><path d="m13.5 6.5 3 3" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    trash: <><path d="M4 7h16M10 11v5M14 11v5" /><path d="m6 7 1 13h10l1-13M9 7V4h6v3" /></>,
  };
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">{paths[name]}</svg>;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [meta, setMeta] = useState({ categories: [], priorities: [], statuses: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [newTask, setNewTask] = useState({});
  const [detailProject, setDetailProject] = useState(null);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 5 });
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  async function loadProjects() {
    const cacheKey = `${search}|${pagination.pageIndex}|${pagination.pageSize}`;
    const cached = projectsCache.get(cacheKey);
    if (cached) {
      setProjects(cached.items);
      setTotal(cached.total);
      setTotalPages(cached.totalPages);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(pagination.pageIndex + 1), pageSize: String(pagination.pageSize), search });
      const response = await fetch(`/api/projects?${params}`);
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data?.error) throw new Error(data?.error || "Failed to load projects");
      const items = Array.isArray(data.items) ? data.items : [];
      const nextTotal = Number(data.total || 0);
      const nextTotalPages = Number(data.totalPages || 1);
      setProjects(items);
      setTotal(nextTotal);
      setTotalPages(nextTotalPages);
      projectsCache.set(cacheKey, { items, total: nextTotal, totalPages: nextTotalPages });
      setError(null);
    } catch (err) {
      setError(err.message);
      setProjects([]);
      setTotal(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProjects();
  }, [pagination.pageIndex, pagination.pageSize, search]);

  useEffect(() => {
    if (projectMetaCache) {
      setMeta(projectMetaCache);
      return;
    }
    fetch("/api/meta").then((response) => response.json()).then((data) => {
      const nextMeta = {
        categories: Array.isArray(data?.categories) ? data.categories : [],
        priorities: Array.isArray(data?.priorities) ? data.priorities : [],
        statuses: Array.isArray(data?.statuses) ? data.statuses : [],
      };
      projectMetaCache = nextMeta;
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

  function openDetails(p) {
    setDetailProject(p);
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
      projectsCache.clear();
      loadProjects();
    } else {
      const data = await res.json();
      alert(data.error || "Something went wrong");
    }
  }

  async function deleteProject(id) {
    if (!confirm("Delete this project and all of its tasks?")) return;
    await fetch(`/api/projects/${id}`, { method: "DELETE" });
    projectsCache.clear();
    loadProjects();
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
    projectsCache.clear();
    loadProjects();
  }

  async function cycleTaskStatus(task) {
    // NOT_STARTED(1) -> IN_PROGRESS(2) -> COMPLETED(3) -> back to NOT_STARTED(1)
    const status = Number(task.STATUS_ID) || 1;
    const next = status === 3 ? 1 : status + 1;
    await fetch(`/api/project-tasks/${task.ID}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ STATUS_ID: next }),
    });
    projectsCache.clear();
    loadProjects();
  }

  async function deleteTask(id) {
    await fetch(`/api/project-tasks/${id}`, { method: "DELETE" });
    projectsCache.clear();
    loadProjects();
  }

  const columns = [
    {
      accessorKey: "NAME",
      header: "Project",
      cell: ({ row }) => (
        <div className="min-w-48">
          <div className="text-lg font-display">{row.original.NAME}</div>
          {row.original.DESCRIPTION && <p className="mt-1 text-xs text-paper-text/60">{row.original.DESCRIPTION}</p>}
        </div>
      ),
    },
    {
      id: "details",
      header: "Details",
      cell: ({ row }) => (
        <div className="text-xs min-w-44 stamp text-paper-text/60">
          <div>{row.original.STATUS_TITLE || "no status"}</div>
          {row.original.TECHNOLOGY && <div className="mt-1">{row.original.TECHNOLOGY}</div>}
          {row.original.END_DATE && <div className="mt-1">due {row.original.END_DATE}</div>}
        </div>
      ),
    },
    {
      accessorKey: "PROGRESS",
      header: "Progress",
      cell: ({ row }) => (
        <div className="min-w-28">
          <div className="mb-1 font-mono text-xs">{row.original.PROGRESS ?? 0}%</div>
          <div className="h-1.5 overflow-hidden rounded-full bg-paper-dim"><div className="h-full bg-teal" style={{ width: `${Math.min(row.original.PROGRESS ?? 0, 100)}%` }} /></div>
        </div>
      ),
    },
    {
      id: "tasks",
      header: "Tasks",
      cell: ({ row }) => (
        <div className="min-w-64">
          <div className="space-y-1.5">
            {(row.original.tasks || []).map((task) => (
              <div key={task.ID} className="flex items-center gap-2 text-xs">
                <button onClick={() => cycleTaskStatus(task)} className="stamp px-2 py-0.5 rounded-full border border-paper-text/20 hover:border-teal hover:text-teal">{task.STATUS_TITLE || "NOT_STARTED"}</button>
                <span>{task.TITLE}</span>
                <button onClick={() => deleteTask(task.ID)} className="ml-auto text-paper-text/30 hover:text-brick" aria-label="Delete task">×</button>
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-2">
            <input className="field-input w-full !bg-white/40 !text-paper-text !border-paper-text/20 text-xs" placeholder="add task" value={newTask[row.original.ID] || ""} onChange={(event) => setNewTask((current) => ({ ...current, [row.original.ID]: event.target.value }))} onKeyDown={(event) => event.key === "Enter" && addTask(row.original.ID)} />
            <button className="btn btn-ghost !border-paper-text/20 !text-paper-text !px-3" title="Add task" aria-label="Add task" onClick={() => addTask(row.original.ID)}><Icon name="plus" /></button>
          </div>
        </div>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex gap-1">
          <button className="btn btn-ghost !px-2 !text-paper-text" title="View project details" aria-label="View project details" onClick={() => openDetails(row.original)}><Icon name="eye" /></button>
          <button className="btn btn-ghost !px-2 !text-paper-text" title="Edit project" aria-label="Edit project" onClick={() => openEdit(row.original)}><Icon name="edit" /></button>
          <button className="btn btn-danger !px-2" title="Delete project" aria-label="Delete project" onClick={() => deleteProject(row.original.ID)}><Icon name="trash" /></button>
        </div>
      ),
    },
  ];
  const table = useReactTable({ data: projects, columns, getCoreRowModel: getCoreRowModel(), manualPagination: true, pageCount: totalPages, state: { pagination }, onPaginationChange: setPagination });

  return (
    <div className="w-full max-w-none">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
        <div>
          <div className="stamp text-amber text-[11px] mb-2">02 · projects</div>
          <h1 className="text-3xl font-display text-paper">Projects</h1>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          + new project
        </button>
      </div>

      {error && <div className="px-5 py-3 mb-6 text-sm border-l-4 paper-card border-brick">{error}</div>}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <input className="field-input w-full max-w-sm !bg-white/10" placeholder="search projects" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} />
        <label className="flex items-center gap-2 text-xs text-paper/60">rows
          <select className="field-input !bg-white/10" value={pagination.pageSize} onChange={(event) => setPagination({ pageIndex: 0, pageSize: Number(event.target.value) })}>
            {[5, 10, 20, 50].map((size) => <option key={size} value={size}>{size}</option>)}
          </select>
        </label>
      </div>
      <div className="overflow-x-auto paper-card glass-table">
        <table className="w-full min-w-[900px] text-left">
          <thead className="border-b border-paper-text/15">
            {table.getHeaderGroups().map((headerGroup) => <tr key={headerGroup.id}>{headerGroup.headers.map((header) => <th key={header.id} className="px-4 py-3 text-[10px] stamp text-paper-text/50">{flexRender(header.column.columnDef.header, header.getContext())}</th>)}</tr>)}
          </thead>
          <tbody>
            {!loading && projects.length === 0 && <tr><td colSpan={columns.length} className="px-4 py-8 text-sm text-paper-text/60">{search ? "No matching projects." : "No projects yet — start your first build."}</td></tr>}
            {table.getRowModel().rows.map((row) => <tr key={row.id} className="align-top border-b border-paper-text/10 last:border-0 animate-fadeUp">{row.getVisibleCells().map((cell) => <td key={cell.id} className="px-4 py-4">{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>)}</tr>)}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between gap-3 mt-4 text-xs text-paper/60">
        <span>{total === 0 ? "0" : `${pagination.pageIndex * pagination.pageSize + 1}-${Math.min((pagination.pageIndex + 1) * pagination.pageSize, total)} of ${total}`}</span>
        <div className="flex gap-2"><button className="text-xs btn btn-ghost" disabled={pagination.pageIndex === 0 || loading} onClick={() => table.previousPage()}>previous</button><button className="text-xs btn btn-ghost" disabled={pagination.pageIndex >= totalPages - 1 || loading} onClick={() => table.nextPage()}>next</button></div>
      </div>
      {/*
        The old card list is intentionally replaced by the table above.
      */}
      {false && projects.map((p) => (
          <div key={p.ID} className="p-5 paper-card animate-fadeUp">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-display">{p.NAME}</h3>
                <div className="stamp text-[10px] text-paper-text/50 mt-1">
                  {p.STATUS_TITLE || "no status"}
                  {p.TECHNOLOGY ? ` · ${p.TECHNOLOGY}` : ""}
                  {p.END_DATE ? ` · due ${p.END_DATE}` : ""}
                </div>
                {p.DESCRIPTION && <p className="mt-2 text-sm text-paper-text/80">{p.DESCRIPTION}</p>}
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
              <div className="flex items-center justify-between mb-1 text-xs">
                <span className="stamp text-paper-text/50">progress</span>
                <span className="font-mono">{p.PROGRESS ?? 0}%</span>
              </div>
              <div className="h-1.5 bg-paper-dim rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-teal" style={{ width: `${Math.min(p.PROGRESS ?? 0, 100)}%` }} />
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-paper-dim">
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
                      className="ml-auto text-xs text-paper-text/30 hover:text-brick"
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

      <Modal open={!!detailProject} onClose={() => setDetailProject(null)} title="Project details">
        {detailProject && <div className="space-y-4"><div><div className="stamp text-[10px] text-paper-text/50">name</div><h2 className="mt-1 text-2xl font-display">{detailProject.NAME}</h2></div><p className="text-sm text-paper-text/70">{detailProject.DESCRIPTION || "No description added."}</p><div className="grid grid-cols-2 gap-3 text-xs"><div><div className="stamp text-[10px] text-paper-text/50">status</div>{detailProject.STATUS_TITLE || "no status"}</div><div><div className="stamp text-[10px] text-paper-text/50">technology</div>{detailProject.TECHNOLOGY || "none"}</div><div><div className="stamp text-[10px] text-paper-text/50">start date</div>{detailProject.START_DATE || "none"}</div><div><div className="stamp text-[10px] text-paper-text/50">end date</div>{detailProject.END_DATE || "none"}</div></div><div><div className="stamp text-[10px] text-paper-text/50 mb-2">tasks</div>{(detailProject.tasks || []).length === 0 ? <p className="text-sm text-paper-text/60">No tasks yet.</p> : detailProject.tasks.map((task) => <div key={task.ID} className="text-sm">{task.STATUS_TITLE || "NOT_STARTED"} · {task.TITLE}</div>)}</div></div>}
      </Modal>

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
