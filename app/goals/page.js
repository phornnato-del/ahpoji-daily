"use client";

import { useEffect, useState } from "react";
import { flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import Modal from "../components/Modal";
import LoadingSpinner from "../components/LoadingSpinner";

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

const goalsCache = new Map();
let metaCache = null;

function clearGoalsCache() {
  goalsCache.clear();
}

function Icon({ name }) {
  const paths = {
    eye: <><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" /><circle cx="12" cy="12" r="2.5" /></>,
    edit: <><path d="m4 16-.7 3.7L7 19l11-11-3-3L4 16Z" /><path d="m13.5 6.5 3 3" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    trash: <><path d="M4 7h16M10 11v5M14 11v5" /><path d="m6 7 1 13h10l1-13M9 7V4h6v3" /></>,
  };

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      {paths[name]}
    </svg>
  );
}

export default function GoalsPage() {
  const [goals, setGoals] = useState([]);
  const [meta, setMeta] = useState({ categories: [], priorities: [], statuses: [] });
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailGoal, setDetailGoal] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [newTaskName, setNewTaskName] = useState({});
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 5 });
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  async function loadGoals() {
    const cacheKey = `${search}|${pagination.pageIndex}|${pagination.pageSize}`;
    const cached = goalsCache.get(cacheKey);
    if (cached) {
      setGoals(cached.items);
      setTotal(cached.total);
      setTotalPages(cached.totalPages);
      setLoading(false);
      setInitialLoading(false);
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(pagination.pageIndex + 1),
        pageSize: String(pagination.pageSize),
        search,
      });
      const response = await fetch(`/api/goals?${params}`);
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data?.error) throw new Error(data?.error || "Failed to load goals");

      setGoals(Array.isArray(data.items) ? data.items : []);
      setTotal(Number(data.total || 0));
      setTotalPages(Number(data.totalPages || 1));
      goalsCache.set(cacheKey, {
        items: Array.isArray(data.items) ? data.items : [],
        total: Number(data.total || 0),
        totalPages: Number(data.totalPages || 1),
      });
      setError(null);
    } catch (err) {
      setError(err.message);
      setGoals([]);
      setTotal(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }

  useEffect(() => {
    loadGoals();
    // loadGoals is intentionally scoped to the current query state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.pageIndex, pagination.pageSize, search]);

  useEffect(() => {
    if (metaCache) {
      setMeta(metaCache);
      return;
    }
    fetch("/api/meta").then((response) => response.json()).then((data) => {
      const nextMeta = {
        categories: Array.isArray(data?.categories) ? data.categories : [],
        priorities: Array.isArray(data?.priorities) ? data.priorities : [],
        statuses: Array.isArray(data?.statuses) ? data.statuses : [],
      };
      metaCache = nextMeta;
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

  function openDetails(g) {
    setDetailGoal(g);
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
      clearGoalsCache();
      loadGoals();
    } else {
      const data = await res.json();
      alert(data.error || "Something went wrong");
    }
  }

  async function deleteGoal(id) {
    if (!confirm("Delete this goal and all of its tasks?")) return;
    await fetch(`/api/goals/${id}`, { method: "DELETE" });
    clearGoalsCache();
    loadGoals();
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
    clearGoalsCache();
    loadGoals();
  }

  async function toggleTask(task) {
    await fetch(`/api/goal-tasks/${task.ID}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ COMPLETED: task.COMPLETED ? 0 : 1 }),
    });
    clearGoalsCache();
    loadGoals();
  }

  async function deleteTask(id) {
    await fetch(`/api/goal-tasks/${id}`, { method: "DELETE" });
    clearGoalsCache();
    loadGoals();
  }

  const goalCategories = meta.categories.filter((c) => c.TYPE === "GOAL");
  const columns = [
    {
      accessorKey: "TITLE",
      header: "Goal",
      cell: ({ row }) => (
        <div className="min-w-48">
          <div className="text-lg font-display">{row.original.TITLE}</div>
          {row.original.DESCRIPTION && <p className="mt-1 text-xs text-paper-text/60">{row.original.DESCRIPTION}</p>}
        </div>
      ),
    },
    {
      id: "details",
      header: "Details",
      cell: ({ row }) => (
        <div className="text-xs min-w-36 stamp text-paper-text/60">
          <div>{row.original.CATEGORY_TITLE || "uncategorized"}</div>
          <div className="mt-1">{row.original.STATUS_TITLE || "no status"}</div>
          {row.original.PRIORITY_TITLE && <div className="mt-1 text-amber">{row.original.PRIORITY_TITLE}</div>}
        </div>
      ),
    },
    {
      accessorKey: "PROGRESS",
      header: "Progress",
      cell: ({ row }) => (
        <div className="min-w-28">
          <div className="flex justify-between mb-1 font-mono text-xs"><span>{row.original.PROGRESS ?? 0}%</span></div>
          <div className="h-1.5 overflow-hidden rounded-full bg-paper-dim">
            <div className="h-full bg-amber" style={{ width: `${Math.min(row.original.PROGRESS ?? 0, 100)}%` }} />
          </div>
        </div>
      ),
    },
    {
      id: "tasks",
      header: "Tasks",
      cell: ({ row }) => (
        <div className="min-w-56">
          <div className="space-y-1.5">
            {(row.original.tasks || []).filter((task) => Number(task.COMPLETED) !== 1).map((task) => (
              <div key={task.ID} className="flex items-center gap-2 text-xs">
                <input type="checkbox" checked={Number(task.COMPLETED) === 1} onChange={() => toggleTask(task)} className="accent-amber-dark" />
                <span>{task.TASK_NAME}</span>
                <button onClick={() => deleteTask(task.ID)} className="ml-auto text-paper-text/30 hover:text-brick">remove</button>
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-2">
            <input
              className="field-input w-full !bg-white/40 !text-paper-text !border-paper-text/20 text-xs"
              placeholder="add task"
              value={newTaskName[row.original.ID] || ""}
              onChange={(event) => setNewTaskName((current) => ({ ...current, [row.original.ID]: event.target.value }))}
              onKeyDown={(event) => event.key === "Enter" && addTask(row.original.ID)}
            />
            <button className="btn btn-ghost !border-paper-text/20 !text-paper-text !px-3 text-base leading-none" title="Add task" aria-label="Add task" onClick={() => addTask(row.original.ID)}>
              <Icon name="plus" />
            </button>
          </div>
        </div>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex gap-1">
          <button className="btn btn-ghost !px-2 !text-paper-text" title="View goal details" aria-label="View goal details" onClick={() => openDetails(row.original)}><Icon name="eye" /></button>
          <button className="btn btn-ghost !px-2 !text-paper-text" title="Edit goal" aria-label="Edit goal" onClick={() => openEdit(row.original)}><Icon name="edit" /></button>
          <button className="btn btn-danger !px-2" title="Delete goal" aria-label="Delete goal" onClick={() => deleteGoal(row.original.ID)}><Icon name="trash" /></button>
        </div>
      ),
    },
  ];
  const table = useReactTable({
    data: goals,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: totalPages,
    state: { pagination },
    onPaginationChange: setPagination,
  });

  return (
    <div className="w-full max-w-none">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
        <div>
          <div className="stamp text-amber text-[11px] mb-2">01 · goals</div>
          <h1 className="text-3xl font-display text-paper">Goals</h1>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          + new goal
        </button>
      </div>

      {error && (
        <div className="px-5 py-3 mb-6 text-sm border-l-4 paper-card border-brick">{error}</div>
      )}
      {initialLoading && <LoadingSpinner />}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <input
          className="field-input w-full max-w-sm !bg-white/10"
          placeholder="search goals"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
        />
        <label className="flex items-center gap-2 text-xs text-paper/60">
          rows
          <select
            className="field-input !bg-white/10"
            value={pagination.pageSize}
            onChange={(event) => setPagination({ pageIndex: 0, pageSize: Number(event.target.value) })}
          >
            {[5, 10, 20, 50].map((size) => <option key={size} value={size}>{size}</option>)}
          </select>
        </label>
      </div>

      <div className="overflow-x-auto paper-card glass-table">
        <table className="w-full min-w-[900px] text-left">
          <thead className="border-b border-paper-text/15">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="px-4 py-3 text-[10px] stamp text-paper-text/50">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {!loading && goals.length === 0 && (
              <tr><td colSpan={columns.length} className="px-4 py-8 text-sm text-paper-text/60">{search ? "No matching goals." : "No goals yet — log your first one."}</td></tr>
            )}
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="align-top border-b border-paper-text/10 last:border-0 animate-fadeUp">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-4">{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between gap-3 mt-4 text-xs text-paper/60">
        <span>{total === 0 ? "0" : `${pagination.pageIndex * pagination.pageSize + 1}-${Math.min((pagination.pageIndex + 1) * pagination.pageSize, total)} of ${total}`}</span>
        <div className="flex gap-2">
          <button className="text-xs btn btn-ghost" disabled={pagination.pageIndex === 0 || loading} onClick={() => table.previousPage()}>previous</button>
          <button className="text-xs btn btn-ghost" disabled={pagination.pageIndex >= totalPages - 1 || loading} onClick={() => table.nextPage()}>next</button>
        </div>
      </div>

      <Modal open={!!detailGoal} onClose={() => setDetailGoal(null)} title="Goal details">
        {detailGoal && (
          <div className="space-y-4">
            <div>
              <div className="stamp text-[10px] text-paper-text/50">title</div>
              <h2 className="mt-1 text-2xl font-display">{detailGoal.TITLE}</h2>
            </div>
            <p className="text-sm text-paper-text/70">{detailGoal.DESCRIPTION || "No description added."}</p>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div><div className="stamp text-[10px] text-paper-text/50">category</div>{detailGoal.CATEGORY_TITLE || "uncategorized"}</div>
              <div><div className="stamp text-[10px] text-paper-text/50">status</div>{detailGoal.STATUS_TITLE || "no status"}</div>
              <div><div className="stamp text-[10px] text-paper-text/50">priority</div>{detailGoal.PRIORITY_TITLE || "none"}</div>
              <div><div className="stamp text-[10px] text-paper-text/50">target date</div>{detailGoal.TARGET_DATE || "none"}</div>
            </div>
            <div>
              <div className="stamp text-[10px] text-paper-text/50 mb-2">tasks</div>
              {(detailGoal.tasks || []).length === 0 ? <p className="text-sm text-paper-text/60">No tasks yet.</p> : detailGoal.tasks.map((task) => (
                <div key={task.ID} className="text-sm">{Number(task.COMPLETED) === 1 ? "[done] " : "[ ] "}{task.TASK_NAME}</div>
              ))}
            </div>
          </div>
        )}
      </Modal>

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
