import { query, APP_USER_ID } from "@/lib/db";
import { unstable_cache } from "next/cache";

export const dynamic = "force-dynamic";

async function getData() {
  const [goals, projects, activities, notes] = await Promise.all([
    query(
      `SELECT g.*, s.TITLE AS STATUS_TITLE FROM goals g LEFT JOIN status s ON s.ID = g.STATUS_ID
       WHERE g.USER_ID = ? ORDER BY g.CREATED_AT DESC`,
      [APP_USER_ID]
    ),
    query(
      `SELECT p.*, s.TITLE AS STATUS_TITLE FROM projects p LEFT JOIN status s ON s.ID = p.STATUS
       WHERE p.USER_ID = ? ORDER BY p.CREATED_AT DESC`,
      [APP_USER_ID]
    ),
    query(
      `SELECT a.* FROM activities a WHERE a.USER_ID = ? ORDER BY a.ACTIVITY_DATE DESC, a.ID DESC LIMIT 6`,
      [APP_USER_ID]
    ),
    query(
      `SELECT n.* FROM knowledge_notes n WHERE n.USER_ID = ? ORDER BY n.FAVORITE DESC, n.CREATED_AT DESC LIMIT 4`,
      [APP_USER_ID]
    ),
  ]);
  return { goals, projects, activities, notes };
}

const getCachedData = unstable_cache(getData, ["dashboard-data"], {
  revalidate: 30,
});
function Stat({ num, label, accent }) {
  return (
    <div className="paper-card px-5 py-4 flex-1 min-w-[140px]">
      <div className={`font-display text-3xl ${accent}`}>{num}</div>
      <div className="stamp text-[10px] text-paper-text/50 mt-1">{label}</div>
    </div>
  );
}

function ProjectChart({ projects }) {
  const statusGroups = [
    { label: "active", count: projects.filter((p) => ![3, 4].includes(Number(p.STATUS))).length, color: "bg-teal" },
    { label: "completed", count: projects.filter((p) => Number(p.STATUS) === 3).length, color: "bg-amber" },
    { label: "closed", count: projects.filter((p) => Number(p.STATUS) === 4).length, color: "bg-brick" },
  ];
  const total = projects.length || 1;

  return (
    <section className="p-5 paper-card md:p-6">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <div className="stamp text-[10px] text-teal mb-2">project pulse</div>
          <h2 className="text-2xl font-display">Your portfolio at a glance</h2>
        </div>
        <div className="text-right">
          <div className="text-3xl font-display text-amber">{projects.length}</div>
          <div className="stamp text-[10px] text-paper-text/50">total</div>
        </div>
      </div>
      <div className="space-y-4">
        {statusGroups.map((group) => (
          <div key={group.label}>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="stamp text-paper-text/60">{group.label}</span>
                <span className="font-mono text-paper-text/60">{group.count}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-paper-dim">
              <div
                className={`h-full ${group.color} rounded-full transition-all`}
                  style={{ width: `${(group.count / total) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function TechnologyChart({ projects }) {
  const technologyCounts = projects.reduce((counts, project) => {
    String(project.TECHNOLOGY || "").split(",").forEach((technology) => {
      const label = technology.trim();
      if (label) {
        const key = label.toLowerCase();
        counts[key] = counts[key] || { label, count: 0 };
        counts[key].count += 1;
      }
    });
    return counts;
  }, {});
  const technologies = Object.values(technologyCounts)
    .sort((first, second) => second.count - first.count);
  const highestCount = Math.max(...technologies.map((technology) => technology.count), 1);
  const middleCount = Math.ceil(highestCount / 2);

  return (
    <section className="p-5 paper-card md:p-6">
      <div className="flex items-end justify-between gap-4 mb-6">
        <div>
          <div className="stamp text-[10px] text-teal mb-2">technology mix</div>
          <h2 className="text-2xl font-display">Projects by language &amp; stack</h2>
        </div>
        <span className="stamp text-[10px] text-paper-text/50">{technologies.length} tracked</span>
      </div>
      {technologies.length === 0 ? (
        <p className="text-sm text-paper-text/60">Add a technology to a project to see the breakdown.</p>
      ) : <div className="relative h-56 pt-3 overflow-x-auto">
        <div className="relative min-w-[560px] h-full">
        <div className="absolute left-0 flex flex-col justify-between pointer-events-none top-3 bottom-10 w-7">
          {[highestCount, middleCount, 0].map((value, index) => (
            <span key={`${value}-${index}`} className="font-mono text-[10px] leading-none text-paper-text/40">{value}</span>
          ))}
        </div>
        <div className="absolute inset-x-0 flex flex-col justify-between pointer-events-none left-8 top-3 bottom-10">
          {[0, 1, 2, 3, 4].map((line) => <div key={line} className="border-t border-paper-text/10" />)}
        </div>
        <div className="relative flex items-end justify-between h-full gap-2 pl-8 pr-1">
          {technologies.map(({ label, count }, index) => (
            <div key={label.toLowerCase()} className="flex flex-col items-center justify-end flex-1 h-full min-w-0 gap-3">
              <div className="flex items-end justify-center w-full h-full">
                <div className="relative flex items-end justify-center w-full h-full group">
                  <div
                    className={`w-full max-w-10 rounded-t-lg animate-barGrow shadow-sm ${index === 0 ? "bg-blue-500" : "bg-amber"}`}
                    style={{
                      height: `${(count / highestCount) * 100}%`,
                      animationDelay: `${index * 70}ms`,
                    }}
                  />
                  <span className="absolute bottom-2 z-10 px-2 py-1 text-[10px] font-mono text-white transition-opacity -translate-x-1/2 bg-[#1B2420] rounded-md left-1/2 opacity-0 pointer-events-none whitespace-nowrap group-hover:opacity-100">
                    {count} {count === 1 ? "project" : "projects"}
                  </span>
                </div>
              </div>
              <span className={`w-full h-8 text-center text-[11px] leading-4 truncate ${index === 0 ? "font-semibold text-paper-text" : "text-paper-text/60"}`}>
                {label}
              </span>
            </div>
          ))}
        </div>
        </div>
      </div>}
    </section>
  );
}

function GoalChart({ goals }) {
  const active = goals.filter((g) => ![3, 4].includes(Number(g.STATUS_ID))).length;
  const completed = goals.filter((g) => Number(g.STATUS_ID) === 3).length;
  const closed = goals.filter((g) => Number(g.STATUS_ID) === 4).length;
  const total = goals.length || 1;
  const activeAngle = (active / total) * 360;
  const completedAngle = activeAngle + (completed / total) * 360;
  const chartStyle = {
    background: goals.length
      ? `conic-gradient(#4FB3A9 0deg ${activeAngle}deg, #E7A73E ${activeAngle}deg ${completedAngle}deg, #C8553D ${completedAngle}deg 360deg)`
      : "#D5CCBA",
  };

  return (
    <section className="p-5 paper-card md:p-6">
      <div className="stamp text-[10px] text-teal mb-2">goal status</div>
      <div className="flex items-center gap-6">
        <div className="relative grid w-32 h-32 rounded-full shrink-0 place-items-center" style={chartStyle}>
          <div className="absolute grid w-20 h-20 text-center rounded-full bg-[#EDE6D6] place-items-center">
            <span className="text-2xl font-display">{goals.length}</span>
            <span className="stamp text-[8px] text-paper-text/50">goals</span>
          </div>
        </div>
        <div className="flex-1 space-y-3 text-xs">
          {[
            ["active", active, "bg-teal"],
            ["completed", completed, "bg-amber"],
            ["closed", closed, "bg-brick"],
          ].map(([label, count, color]) => (
            <div key={label} className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 stamp text-paper-text/60">
                <span className={`w-2 h-2 rounded-full ${color}`} />
                {label}
              </span>
              <span className="font-mono">{count}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default async function DashboardPage() {
  let data;
  let dbError = null;
  try {
    data = await getCachedData();
  } catch (err) {
    dbError = err.message;
    data = { goals: [], projects: [], activities: [], notes: [] };
  }
  const { goals, projects, activities, notes } = data;

  const activeGoals = goals.filter((g) => ![3, 4].includes(Number(g.STATUS_ID))).length;
  const activeProjects = projects.filter((p) => ![3, 4].includes(Number(p.STATUS))).length;
  const totalProjects = projects.length;
  const totalMinutes = activities.reduce((sum, a) => sum + (a.DURATION_MINUTES || 0), 0);

  return (
    <div className="w-full max-w-none">
      <div className="flex flex-wrap items-end justify-between gap-6 mb-8">
        <div className="stamp text-amber text-[11px] mb-2">
          {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </div>
        <div>
          <h1 className="text-3xl font-display md:text-5xl text-paper">Today's overview</h1>
          <p className="mt-2 text-sm text-paper/50">A clear view of what is moving forward.</p>
        </div>
        <div className="hidden md:block stamp text-[10px] text-teal border border-ink-line px-3 py-2 rounded-full">
          field notes · live
        </div>
      </div>

      {dbError && (
        <div className="px-5 py-4 mb-8 text-sm border-l-4 paper-card border-brick">
          <strong className="text-brick">Couldn't reach MySQL:</strong> {dbError}
          <div className="mt-1 text-paper-text/70">
            Check your <code>.env.local</code> connection settings — see the README.
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-4 mb-10">
        <Stat num={activeGoals} label="active goals" accent="text-amber" />
        <Stat num={totalProjects} label="total projects" accent="text-paper-text" />
        <Stat num={activities.length} label="recent activities" accent="text-paper-text" />
        <Stat num={totalMinutes} label="minutes logged" accent="text-brick" />
      </div>

      <div className="mb-6">
        <TechnologyChart projects={projects} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <section className="min-w-0">
          <div className="flex items-end justify-between gap-4 mb-3">
            <div>
              <h2 className="text-xs stamp text-teal">goals in progress</h2>
              <p className="mt-1 text-xs text-paper/40">Your next decisions, ranked by progress.</p>
            </div>
            <span className="stamp text-[10px] text-amber">{activeGoals} open</span>
          </div>
          <div className="space-y-3">
            {goals.length === 0 && (
              <p className="text-sm text-paper/50">No goals logged yet.</p>
            )}
            {goals.filter((g) => ![3, 4].includes(Number(g.STATUS_ID))).slice(0, 5).map((g) => (
              <div key={g.ID} className="px-4 py-4 border-l-4 paper-card border-amber">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium">{g.TITLE}</span>
                  <span className="stamp text-[10px] text-paper-text/50">{g.PROGRESS ?? 0}%</span>
                </div>
                <div className="h-1.5 bg-paper-dim rounded-full mt-2 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-amber"
                    style={{ width: `${Math.min(g.PROGRESS ?? 0, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="min-w-0">
          <div className="flex items-end justify-between gap-4 mb-3">
            <div>
              <h2 className="text-xs stamp text-teal">recent activity log</h2>
              <p className="mt-1 text-xs text-paper/40">What happened most recently.</p>
            </div>
            <span className="stamp text-[10px] text-brick">{totalMinutes} min</span>
          </div>
          <div className="overflow-hidden paper-card">
            {activities.length === 0 && (
              <p className="p-4 text-sm text-paper-text/60">Nothing logged yet.</p>
            )}
            {activities.map((a) => (
              <div key={a.ID} className="flex items-center justify-between gap-4 px-4 py-3 border-b border-paper-text/10 last:border-0">
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{a.ACTIVITY_NAME}</div>
                  <div className="stamp text-[10px] text-paper-text/50">{a.ACTIVITY_DATE || "no date"}</div>
                </div>
                <span className="font-mono text-xs shrink-0 text-paper-text/70">
                  {a.DURATION_MINUTES ? `${a.DURATION_MINUTES}m` : "—"}
                </span>
              </div>
            ))}
          </div>
        </section>

        <GoalChart goals={goals} />
        <ProjectChart projects={projects} />

        <section>
          <h2 className="mb-3 text-xs stamp text-teal">projects</h2>
          <div className="space-y-2">
            {projects.length === 0 && (
              <p className="text-sm text-paper/50">No projects yet.</p>
            )}
            {projects.slice(0, 5).map((p) => (
              <div key={p.ID} className="px-4 py-3 paper-card">
                <div className="text-sm font-medium">{p.NAME}</div>
                <div className="stamp text-[10px] text-paper-text/50 mt-0.5">
                  {p.STATUS_TITLE || "no status"}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-xs stamp text-teal">favorite notes</h2>
          <div className="space-y-2">
            {notes.length === 0 && (
              <p className="text-sm text-paper/50">No notes saved yet.</p>
            )}
            {notes.map((n) => (
              <div key={n.ID} className="px-4 py-3 paper-card">
                <div className="text-sm font-medium">
                  {n.FAVORITE ? "★ " : ""}
                  {n.TITLE}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
