import { query, APP_USER_ID } from "@/lib/db";

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

function Stat({ num, label, accent }) {
  return (
    <div className="paper-card px-5 py-4 flex-1 min-w-[140px]">
      <div className={`font-display text-3xl ${accent}`}>{num}</div>
      <div className="stamp text-[10px] text-paper-text/50 mt-1">{label}</div>
    </div>
  );
}

export default async function DashboardPage() {
  let data;
  let dbError = null;
  try {
    data = await getData();
  } catch (err) {
    dbError = err.message;
    data = { goals: [], projects: [], activities: [], notes: [] };
  }
  const { goals, projects, activities, notes } = data;

  const activeGoals = goals.filter((g) => g.STATUS_ID !== 3 && g.STATUS_ID !== 4).length;
  const activeProjects = projects.filter((p) => p.STATUS !== 3 && p.STATUS !== 4).length;
  const totalMinutes = activities.reduce((sum, a) => sum + (a.DURATION_MINUTES || 0), 0);

  return (
    <div className="max-w-5xl">
      <div className="mb-8">
        <div className="stamp text-amber text-[11px] mb-2">
          {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </div>
        <h1 className="font-display text-3xl md:text-4xl text-paper">Today's overview</h1>
      </div>

      {dbError && (
        <div className="paper-card border-l-4 border-brick px-5 py-4 mb-8 text-sm">
          <strong className="text-brick">Couldn't reach MySQL:</strong> {dbError}
          <div className="mt-1 text-paper-text/70">
            Check your <code>.env.local</code> connection settings — see the README.
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-4 mb-10">
        <Stat num={activeGoals} label="active goals" accent="text-amber" />
        <Stat num={activeProjects} label="active projects" accent="text-teal" />
        <Stat num={activities.length} label="recent activities" accent="text-paper-text" />
        <Stat num={totalMinutes} label="minutes logged" accent="text-brick" />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <section>
          <h2 className="stamp text-xs text-teal mb-3">goals in progress</h2>
          <div className="space-y-3">
            {goals.length === 0 && (
              <p className="text-paper/50 text-sm">No goals logged yet.</p>
            )}
            {goals.slice(0, 5).map((g) => (
              <div key={g.ID} className="paper-card px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium text-sm">{g.TITLE}</span>
                  <span className="stamp text-[10px] text-paper-text/50">{g.PROGRESS ?? 0}%</span>
                </div>
                <div className="h-1.5 bg-paper-dim rounded-full mt-2 overflow-hidden">
                  <div
                    className="h-full bg-amber rounded-full"
                    style={{ width: `${Math.min(g.PROGRESS ?? 0, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="stamp text-xs text-teal mb-3">recent activity log</h2>
          <div className="space-y-2">
            {activities.length === 0 && (
              <p className="text-paper/50 text-sm">Nothing logged yet.</p>
            )}
            {activities.map((a) => (
              <div key={a.ID} className="paper-card px-4 py-3 flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">{a.ACTIVITY_NAME}</div>
                  <div className="stamp text-[10px] text-paper-text/50">{a.ACTIVITY_DATE || "no date"}</div>
                </div>
                <span className="font-mono text-xs text-paper-text/70">
                  {a.DURATION_MINUTES ? `${a.DURATION_MINUTES}m` : "—"}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="stamp text-xs text-teal mb-3">projects</h2>
          <div className="space-y-2">
            {projects.length === 0 && (
              <p className="text-paper/50 text-sm">No projects yet.</p>
            )}
            {projects.slice(0, 5).map((p) => (
              <div key={p.ID} className="paper-card px-4 py-3">
                <div className="text-sm font-medium">{p.NAME}</div>
                <div className="stamp text-[10px] text-paper-text/50 mt-0.5">
                  {p.STATUS_TITLE || "no status"}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="stamp text-xs text-teal mb-3">favorite notes</h2>
          <div className="space-y-2">
            {notes.length === 0 && (
              <p className="text-paper/50 text-sm">No notes saved yet.</p>
            )}
            {notes.map((n) => (
              <div key={n.ID} className="paper-card px-4 py-3">
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
