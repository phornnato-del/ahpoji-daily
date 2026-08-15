# AHPOJI DAILY

A personal Next.js dashboard wired straight to your `my_schedule` MySQL database
(from your Navicat dump). Full CRUD for Goals, Projects, Activities and
Knowledge Notes, plus checklist tasks under each Goal/Project.

## 1. Import your database

If you haven't already, load the SQL dump you gave me into MySQL/MariaDB:

```bash
mysql -u root -p < my_schedule_dump.sql
```

That creates the `my_schedule` database with `users`, `category`, `priority`,
`status`, `goals`, `goal_tasks`, `projects`, `project_tasks`, `activities`,
and `knowledge_notes` — already seeded with your reference data (categories,
priorities, statuses) and your `ahpoji` user (ID `1`).

## 2. Configure the app

```bash
cd ahpoji-daily
cp .env.local.example .env.local
```

Edit `.env.local` with your real MySQL host/user/password:

```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=my_schedule
APP_USER_ID=1
```

`APP_USER_ID` is the user this instance acts as (matches `users.ID`, `1` for
your `ahpoji` account).

## 3. Install & run

```bash
npm install
npm run dev
```

Open http://localhost:3000 — you'll land on the **Overview** dashboard.

For production:

```bash
npm run build
npm run start
```

## What's inside

- **Overview** (`/`) — stat strip, goal progress bars, recent activity log,
  active projects, favorite notes. Reads straight from MySQL server-side.
- **Goals** (`/goals`) — create/edit/delete goals (category, priority,
  status, dates, progress %), plus an inline checklist of `goal_tasks`.
- **Projects** (`/projects`) — create/edit/delete projects (technology,
  status, dates, progress %), plus an inline `project_tasks` checklist whose
  status badge cycles NOT_STARTED → IN_PROGRESS → COMPLETED on click.
- **Activities** (`/activities`) — a log of `activities` rows: name,
  category, duration in minutes, date, note.
- **Notes** (`/notes`) — `knowledge_notes` as a card grid with tags and a
  one-click favorite star.

## Stack

- Next.js 14 (App Router) — pages are server components where read-only,
  client components for the interactive CRUD screens.
- `mysql2/promise` connection pool talking directly to your database — no
  ORM, plain parameterized SQL in `app/api/**/route.js`.
- Tailwind CSS with a custom "field ledger" theme (deep ink background,
  warm paper cards, amber/teal accents, Fraunces + IBM Plex type).

## Notes on the data model

- Everything is scoped to `APP_USER_ID` — every query filters `WHERE USER_ID = ?`,
  matching the `USER_ID` columns already in your schema.
- Deleting a Goal or Project also deletes its child tasks first (no `ON
  DELETE CASCADE` in the dump, so the app does it in two queries).
- `category`, `priority`, and `status` are treated as read-only reference
  tables (seeded by your dump) and are only fetched via `/api/meta` to
  populate dropdowns — there's no UI to edit them, since your dump already
  ships the full set you need per `TYPE` (`GOAL`, `PROJECT`, `ACTIVITY`,
  `NOTE`).
