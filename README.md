# Campus Connect

A Reddit-like private community platform for CS Department students — clubs,
discussion feeds, moderation, official announcements, and an event calendar.

**Stack:** React 19 + Vite + Tailwind CSS (frontend), Node + Express + MongoDB
(backend). Built on the [Readit](https://github.com/adamt-eng/readit-reddit-clone)
Reddit-clone base, extended with features from
[Keshav833/CampusConnect](https://github.com/Keshav833/CampusConnect) (Google +
GitHub auth, event model),
[harshit-dev-ui/Campus-Connect](https://github.com/harshit-dev-ui/Campus-Connect)
(announcement + admin patterns, FullCalendar), and
[Haseeb-MernStack/commune](https://github.com/Haseeb-MernStack/commune) (MIT,
moderation/report patterns).

> ⚠️ **FIRST ADMIN — replace the placeholder.** The seed script reads admin
> emails from the `ADMIN_EMAILS` env var (with matching `ADMIN_TITLES`). If
> none are set it creates **one placeholder admin**
> (`admin@campusconnect.local` / `changeme123`, title "Head CR") so the app
> is usable immediately. **Change the password and replace it with the three
> real admin emails (Head CR, Head GR, HOD) before any real use.** See
> `backend/.env.example`.

## Features

- **Auth + roles** — email/password signup & login, Google sign-in, GitHub
  sign-in. Roles: `student` (default), `moderator`, `admin`. Three admin
  personas (Head CR, Head GR, HOD) share platform-level access; the
  `adminTitle` is shown next to the admin's name. **No email-domain
  restriction — anyone can sign up.**
- **Clubs** — create, browse, join/leave. Students request a new club from
  Explore; admins approve or reject it (the requester becomes the club's
  first moderator on approval). Per-club roles: member / moderator.
- **Posts, comments, replies** — text, link and image posts; nested comments;
  upvote/downvote; pin posts (moderators); save/bookmark posts (Saved page).
- **Moderation** — report a post or comment (spam / harassment / hate speech /
  misinformation / inappropriate / other); moderators see a queue for their
  own clubs, admins see all; resolve by dismissing or removing. Moderators
  can only moderate their own club.
- **Announcements** — admins publish text + link + document attachments with
  a category and publication date/time; shown at the top of the home feed.
- **Events** — admins (or club moderators) create/update/cancel events
  (title, description, date, time, venue, category); upcoming / past / all
  views; month calendar (FullCalendar); students register/unregister.
- **Document upload** — PDF/DOC/DOCX/PPT/PPTX attachments (10 MB) via Multer.
  Local disk in dev; Cloudinary when `CLOUDINARY_*` is set (required for
  production on Vercel — local-disk uploads do not persist serverless).
- **Responsive** — desktop and mobile layouts (Tailwind + existing CSS).

## Project layout

```
campus-connect/
├── backend/            # Express API (port 5000)
│   ├── Controllers/    # Auth, Club, ClubRequest, Post, Comment, Report,
│   │                   #   Announcement, Event, Admin, Vote, Upload…
│   ├── Models/         # User (role/adminTitle/authProvider), Club (status),
│   │                   #   ClubRequest, Post (type/linkUrl/attachments),
│   │                   #   Report, Announcement, Event, Registration…
│   ├── Middleware/     # requireRole.js (requireAdmin, requireClubModerator)
│   ├── Routers/        # /authentication, /clubs, /club-requests, /posts,
│   │                   #   /comments, /reports, /announcements, /events, /admin
│   └── scripts/        # seedAdmin.js, seedDemo.js
├── frontend/           # React + Vite + Tailwind (port 5173)
│   ├── pages/          # HomePage, ClubPage, ExplorePage, AdminPanel,
│   │                   #   Events, SavedPage, Announcements…
│   └── components/     # Club, Moderation (ReportDialog, ModeratorQueue),
│                        #   Authentication (OAuthButtons)…
├── BUILD_REPORT.md     # What was built, what was verified, what's left
└── README.md
```

## Quick start (local)

Prerequisites: Node 20+ and npm. A MongoDB database (local, or a free
MongoDB Atlas M0 cluster).

```bash
# 1. Backend
cd backend
npm install
cp .env.example .env   # fill in MONGO_URI, JWT_SECRET, FRONTEND_URL,
                       # ADMIN_EMAILS / ADMIN_TITLES, OAuth keys (optional)
npm run dev            # or: node server.js

# 2. Seed the first admin (reads ADMIN_EMAILS / ADMIN_TITLES from .env;
#    falls back to the placeholder admin — see the warning above)
node scripts/seedAdmin.js

# 3. (Optional) demo data — two clubs, an announcement, two events, one post
node scripts/seedDemo.js

# 4. Frontend (in a second terminal)
cd frontend
npm install
npm run dev            # http://localhost:5173
```

Frontend env (`frontend/.env`): `VITE_API_URL=http://localhost:5000` and,
for Google sign-in, `VITE_GOOGLE_CLIENT_ID=<same client ID as the backend>`.

## API overview

| Area | Endpoints |
| --- | --- |
| Auth | `POST /authentication/signup` · `POST /authentication/login` · `POST /authentication/google` · `GET /authentication/github` · `GET /authentication/github/callback` |
| Clubs | `GET /clubs` · `POST /clubs` (student → pending + request) · `GET /clubs/:name` · `POST /clubs/:name/join\|leave` · `GET /clubs/:name/members` · `POST/DELETE /clubs/:name/moderators` (admin) |
| Club requests | `GET /club-requests` · `POST /club-requests/:id/approve` · `POST /club-requests/:id/reject` (admin) |
| Posts | `GET /posts/club/:name` (pinned first) · `POST /posts` · `DELETE /posts/:id` · `POST /posts/:id/pin\|unpin` · `GET /posts/saved` · `POST /posts/:id/save\|unsave` |
| Comments | `POST /comments` · `DELETE /comments/:id` |
| Reports | `POST /reports` · `GET /reports` (admin/mod) · `POST /reports/:id/resolve` |
| Announcements | `GET /announcements` · `POST /announcements` (admin) · `DELETE /announcements/:id` (admin) |
| Events | `GET /events?filter=upcoming\|past\|all` · `POST /events` · `PATCH /events/:id` · `POST /events/:id/cancel` · `DELETE /events/:id` · `POST/DELETE /events/:id/register` |
| Admin | `GET /admin/overview` · `GET /admin/users` · `PATCH /admin/users/:id/role` |
| Upload | `POST /upload/image\|club/icon\|club/banner\|document` |

## Deployment — Vercel for both (free tier)

Both parts deploy on Vercel; the database stays on MongoDB Atlas (Vercel
has no built-in MongoDB). **Nothing is deployed yet** — the steps below are
what the owner runs after the GitHub push. Deploy only after the build is
verified (see `BUILD_REPORT.md`).

### 1. Push to GitHub, then create two Vercel projects

| Project | Root directory | What Vercel does |
| --- | --- | --- |
| Frontend | `frontend` | Vite build → static site. `vercel.json` already has the SPA fallback rewrite (`/(.*)` → `/index.html`). |
| Backend | `backend` | `api/index.js` becomes a serverless function; `backend/vercel.json` rewrites every request to it, and the shared Express app (`app.js`) handles the routing. No `app.listen` in serverless mode. |

### 2. Environment variables (Vercel dashboard, per project)

**Backend project** — from `backend/.env.example`:
`MONGO_URI` (Atlas connection string), `JWT_SECRET`, `FRONTEND_URL` (the
frontend Vercel URL — also used for CORS), `GOOGLE_CLIENT_ID`,
`GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `GITHUB_CALLBACK_URL` (must be
`https://<backend-domain>/authentication/github/callback`),
`ADMIN_EMAILS` / `ADMIN_TITLES` / `ADMIN_PASSWORD`, and for uploads
`CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET`.
Set `NODE_ENV=production`.

**Frontend project**: `VITE_API_URL` (the backend Vercel URL),
`VITE_GOOGLE_CLIENT_ID` (same client ID as the backend).

### 3. Seed the first admin (once, after the first backend deploy)

From the backend project's shell, or locally against the Atlas URI:
`node scripts/seedAdmin.js` (reads `ADMIN_EMAILS` / `ADMIN_TITLES`; falls
back to the placeholder admin — replace it with the real Head CR / Head GR /
HOD emails before real use). Optional demo data: `node scripts/seedDemo.js`.

### 4. GitHub OAuth callback

In the GitHub OAuth app settings, set the Authorization callback URL to the
deployed backend URL + `/authentication/github/callback`, and set
`GITHUB_CALLBACK_URL` to the same value in Vercel.

### Honest serverless limits (do not ignore these)

1. **Socket.io real-time does NOT work on Vercel serverless functions.**
   Serverless functions have no persistent connection, so live DMs and
   live notifications cannot push. The REST endpoints still work — messages
   and notifications are saved to MongoDB and load on refresh — only the
   instant push is missing. DMs are a bonus feature, out of the viva scope.
   (Local dev keeps full real-time via `server.js` + Socket.io.)
2. **Multer local-disk uploads do NOT persist on Vercel.** Files written to
   `uploads/` disappear when the function instance recycles. For production
   uploads, set the `CLOUDINARY_*` env vars (free Cloudinary account):
   uploads then go to Cloudinary and return absolute URLs. Without them,
   uploads "succeed" but the files will 404 later — so set Cloudinary up
   before relying on uploads in production.

## Attribution

- Base project: [Readit](https://github.com/adamt-eng/readit-reddit-clone) by
  adamt-eng (no license file in the original repo; ISC declared in its
  backend package.json).
- Google + GitHub OAuth and the event model: adapted from
  [Keshav833/CampusConnect](https://github.com/Keshav833/CampusConnect).
- Announcement + admin patterns and FullCalendar usage: adapted from
  [harshit-dev-ui/Campus-Connect](https://github.com/harshit-dev-ui/Campus-Connect).
- Report/moderation patterns: adapted from
  [Haseeb-MernStack/commune](https://github.com/Haseeb-MernStack/commune)
  (MIT license).

## Notes / known limits

- The Google and GitHub buttons only work once the OAuth credentials are set
  (see `.env.example`); without them, email/password signup works and the
  Google button shows a "not configured" note.
- Readit's direct messages and AI summary are kept as-is from the base; they
  are not part of the official spec and can be stripped later if wanted.
- On Vercel serverless, Socket.io real-time (DMs/notifications push) does
  not work and local-disk uploads do not persist — see "Deployment" above.
- See `BUILD_REPORT.md` for the full build log, verification results, and
  what still needs the owner's input.
