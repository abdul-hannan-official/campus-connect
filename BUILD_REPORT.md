# Campus Connect — Build Report

**Date:** 2026-11-26
**Stack:** React 19 + Vite + Tailwind CSS (frontend) · Node + Express + MongoDB (backend)
**Base:** [Readit](https://github.com/adamt-eng/readit-reddit-clone) (MERN Reddit clone)
**Working directory:** `/home/hatch/workspace/campus-connect/campus-connect/`
**Source clones (untouched):** `../readit-base/`, `../commune/`,
`../campus-connect-harshit/`, `../campusconnect-events/`, `../univibe-ref/`,
`../uniclub-ref/`
**Status: BUILD COMPLETE — verified locally. NOT deployed, NOT pushed to GitHub.**

## What was built, per phase

### Phase 1 — Auth + roles
- `User` model: `role` (student/moderator/admin, default student),
  `adminTitle` (Head CR / Head GR / HOD, default null), `authProvider`
  (local/google/github), `googleId`, `githubId` (sparse indexes). Password
  required only for local accounts.
- `Middleware/requireRole.js`: `requireAdmin`, `requireClubModerator`
  (moderator of *that* club only, or platform admin), `canModeratePost`.
- `Controllers/AuthController.js` rewritten: fixed bcrypt salt bug (raw env
  string was passed to `bcrypt.hash` — now parsed as an int); `checkAdminRole`
  / `adminTitleForEmail` from the `ADMIN_EMAILS` / `ADMIN_TITLES` env
  allow-list (a signup-body `role: "admin"` is ignored unless the email is
  allow-listed); JWT carries `{ id, role }`; login re-applies the allow-list
  and rejects OAuth accounts at password login with a clear message.
- Google auth ported from Keshav (`POST /authentication/google`,
  google-auth-library ID-token verify) and GitHub auth
  (`GET /authentication/github`, `GET /authentication/github/callback`,
  axios OAuth flow, primary verified email). No Passport. **No domain check
  anywhere** — signup is open to any email, per Hunny's instruction; the
  CollegeDomain model was dropped and never implemented.
- New users from OAuth are auto-created as students (deviation from the
  plan's `needsRole` flow, chosen so signup works end-to-end).
- `backend/scripts/seedAdmin.js`: reads `ADMIN_EMAILS`/`ADMIN_TITLES`/
  `ADMIN_PASSWORD`; falls back to ONE clearly-marked placeholder admin
  (`admin@campusconnect.local` / `changeme123`, title "Head CR") with a loud
  warning. Idempotent.
- Tailwind 3.4.17 + postcss + autoprefixer added to the frontend
  (`tailwind.config.js`, `postcss.config.js`, `src/index.css`); FullCalendar
  6.1.15 (`@fullcalendar/react` + `@fullcalendar/daygrid`).

### Phase 2 — Club management
- Community → Club rename everywhere (backend + frontend, incl. file names,
  routes `/clubs`, `ref: "Club"`, `$lookup from: "clubs"`). No functional
  "community" reference remains (only a CSS class name and one JSX comment).
- `Club` model: `status` (approved/pending/rejected, default approved),
  `isPublic`.
- `ClubRequest` model + controller + router (Harshit GroupRequest shape):
  student creates a club → club stored as `pending` + a ClubRequest is
  opened; admin approves (club → approved, requester stays moderator) or
  rejects (club → rejected, requester's membership removed).
- `ClubController`: admin creates approved clubs directly; `getClubByName`
  hides pending/rejected clubs from non-admins/non-creators; `joinClub`
  only for approved clubs; `getAllClubs`/`searchClubs`/`getTopClubs`
  approved-only for students; `assignModerator` / `removeModerator`
  (admin only; member must have joined first); `getClubMembers`.
- Frontend: Explore page "Request a new club" button + `ClubRequestForm`
  modal (pending status shown after submit); routes renamed to
  `/club/:clubName`.

### Phase 3 — Posts / comments / replies
- Fixed the Readit bug in the `Post` model: `formatPosts` referenced a
  `type` field that did not exist. Added `type` (text/link/image),
  `linkUrl`, `attachments: [String]`.
- `PostController`: `getPostsByClub` filters `isRemoved`, sorts pinned
  first; `createPost` validates type (text needs content, link needs
  linkUrl) and requires club membership; `deletePost` — author hard-deletes,
  moderator/admin soft-removes; new `pinPost` / `unpinPost`.
- `CommentController`: author hard-deletes (with replies); moderator/admin
  soft-removes (content replaced with "[Removed by a moderator]").
- `CreatePostForm` rewritten: fixed a real bug (it sent `type: "post"`,
  which the backend rejects) — now maps tab → text/image/link; Link tab
  added; optional document attachment (uploads first, passes URL in
  `attachments[]`).
- `PostCard`: pinned badge, link posts render as links, document
  attachments render as download links, moderator menu (Pin/Unpin, Remove),
  working Report dialog (was a `console.log`).
- Base bug fixed: `PostPage.jsx` had a broken `setPost` call after adding a
  comment (`...prev, ]);` — the original Readit file never compiled. Repaired
  to increment `commentsCount`; also repaired the file's truncated ending
  (missing closing `}` for the component).

### Phase 4 — Admin panel + moderation
- `Report` model + controller + router (Commune shape, rewritten in JS):
  reason enum (spam/harassment/hate_speech/misinformation/
  inappropriate_content/other), details ≤300, unique open-report index per
  user+post; resolve actions dismiss / remove_post / remove_comment.
- `AdminController` + `AdminRouter` (all behind auth + requireAdmin):
  overview counts, user list (search/pagination), role change (role "admin"
  only honoured for allow-listed emails; cannot demote self).
- `AdminPanel` page (tabs: Overview, Club Requests, Users, Reports,
  Announcements, Events): approve/reject requests, change user roles,
  publish announcements (with document attachment), view the report queue.
- `ModeratorQueue` component: admins see all open reports, club moderators
  see only their own clubs'; resolve from the queue. Shown in the AdminPanel
  and on the ClubPage sidebar for moderators/admins.
- ClubPage moderator tools: pin/unpin + remove via PostCard props, global
  admin role fetched from `/users/me`.

### Phase 5 — Announcements + events
- `Announcement` model + controller + router (Harshit shape + `title`,
  `link`, `attachments[]` per the official spec §B; `createdAt` is the
  publication date/time): admin-only create/delete; list shows global +
  the user's joined clubs, expired auto-hidden.
- `AnnouncementCard` component (category, club, publication date/time,
  link, attachments, sender + admin title) + announcements section at the
  top of the HomePage feed.
- `Event` model + `Registration` model + controller + router (Keshav,
  English-only): category workshop/seminar/competition/department; `status`
  scheduled/cancelled; create/update/cancel/delete; register/unregister;
  list with `?filter=upcoming|past|all` + registration counts +
  `isRegistered`; cancelled events stay visible in past/all views.
- `EventsPage` (FullCalendar month view + list, upcoming/past/all filter,
  EventCard, EventForm create/edit modal, Register button, admin
  edit/cancel/delete) + route `/events` + Navbar links.

### Phase 6 — Polish
- Saved (bookmarks) page: `GET /posts/saved` + `SavedPage` + route
  `/saved` + Navbar link.
- Document upload via Multer: `POST /upload/document` (PDF/DOC/DOCX/PPT/
  PPTX, 10 MB, `uploads/documents/`); `ensureDir` for club banner/icon
  folders (Multer failed when the folder did not exist).
- Login/Signup Google + GitHub buttons (`OAuthButtons`): Google Identity
  Services button → `POST /authentication/google`; GitHub button →
  `GET /authentication/github`. Google button shows a "not configured" note
  when `VITE_GOOGLE_CLIENT_ID` is unset.
- Rebrand Readit → Campus Connect (text wordmark, titles, copy, footer;
  share URLs use `window.location.origin`; attribution link to the Readit
  repo kept in the sidebar).
- `README.md` (setup, API table, deployment, attribution),
  `backend/.env.example`, `frontend/.env.example`.
- `backend/scripts/seedDemo.js`: idempotent demo data (2 clubs, 1
  announcement, 2 events — one upcoming, one past — 1 post), owned by the
  placeholder admin, clearly marked demo content.
- Responsive: new pages use max-width containers, flex-wrap and
  auto-fill grids; the base app's responsive CSS is kept. (Real-device
  check not done — see "Not verified".)

## Deployment — Vercel for both (scope update, 2026-11-26)

Per Hunny: frontend AND backend deploy on Vercel (no Render/Railway).
Database stays MongoDB Atlas.

- **Shared app object:** `backend/app.js` exports `createApp({ io,
  onlineUsers })` — all Express setup and routes, including DM/notification
  routers. `backend/server.js` (local dev) builds it with the real Socket.io
  instance, creates the HTTP server and calls `listen`. `backend/api/index.js`
  (Vercel serverless) builds it with a no-op `io` and exports a handler
  that connects to MongoDB (cached, see `backend/db.js`) then delegates to
  the app. No `app.listen` in serverless mode.
- **Backend Vercel project:** root directory `backend/`; `api/index.js` is
  the serverless function; `backend/vercel.json` rewrites every request to
  it (`/(.*)` → `/api/index`).
- **Frontend Vercel project:** root directory `frontend/`; existing
  `vercel.json` (SPA fallback `/(.*)` → `/index.html`) kept unchanged.
- **Cloudinary (optional, wired):** `backend/cloudinary.js` — when
  `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` /
  `CLOUDINARY_API_SECRET` are set, all five upload routes (avatar, post
  image, club banner, club icon, document) upload to Cloudinary and return
  absolute `https://res.cloudinary.com/...` URLs; the local temp file is
  deleted. When unset, local-disk uploads work exactly as before.
  Frontend `src/utils/mediaUrl.js` (`resolveMediaUrl`) returns absolute
  URLs as-is and prefixes relative `/uploads/...` paths with the API
  origin; used in HomePage, GuestHomePage, PostPage and AnnouncementCard.
- **`git init` done** in the project root; **no commit made** — the first
  commit is left for the owner. `.gitignore` covers `node_modules/`,
  `.env*`, `frontend/dist/`, `backend/Uploads/` and `backend/uploads/`.

### Honest serverless limits (also in README.md)
1. **Socket.io real-time does NOT work on Vercel serverless functions.**
   No persistent connection → live DMs and live notification pushes cannot
   work. The REST endpoints still work (messages/notifications are saved to
   MongoDB and load on refresh); only the instant push is missing. DMs are
   a bonus feature, out of the viva scope. Local dev keeps full real-time.
2. **Multer local-disk uploads do NOT persist on Vercel.** Files written to
   `uploads/` disappear when the function instance recycles. Set the
   `CLOUDINARY_*` env vars before relying on uploads in production.

## Bugs found and fixed during the build
1. `PostRouter` imported `getSavedPosts`/`savePost`/`unsavePost` without
   importing them — would have crashed the server at startup. Imports added.
2. `AuthController` passed the raw `HASHING` env string to `bcrypt.hash`.
   Now parsed as an int.
3. `CreatePostForm` sent `type: "post"` — rejected by the new backend
   validation. Now maps tab → text/image/link.
4. `Post` model had no `type` field but the code required it (§4 bug).
   Field added.
5. `listClubRequests` read `req.currentUser.role`, which is only set by
   `requireRole` — the route uses plain `auth`, so admins were treated as
   students and saw zero requests. Fixed with a DB role lookup. (Caught by
   the smoke test.)
6. `OAuthButtons` posted `{ credential }` to Google auth; the backend
   expects `{ token }`. Fixed.
7. `PostCard` passed `!post.pinned` to the pin handler, which expects the
   current state — the pin toggle was inverted. Fixed.
8. Base bug: `PostPage.jsx` never compiled (`...prev, ]);` + truncated
   file ending). Repaired (comments count increment + closing brace).
9. Base bug: Multer wrote to CWD-relative lowercase `uploads/` while
   Express served capital `Uploads/` — on Linux, fresh uploads 404'd.
   UploadRouter now uses absolute paths under `Uploads/` (where the base
   project's existing files live); the smoke test proves the round-trip
   (upload → disk → GET 200).

## Verification (all run 2026-11-26, Node v24.22.1, npm 10.9.4)

| Check | Command | Result |
| --- | --- | --- |
| Backend `npm install` | `cd backend && npm install` | ✅ pass |
| Frontend `npm install` | `cd frontend && npm install` | ✅ pass (195 pkgs) |
| Backend syntax | `node --check` on every new/changed backend file (`app.js`, `db.js`, `cloudinary.js`, `server.js`, `api/index.js`, all new/changed Models/Controllers/Routers, `scripts/*`) | ✅ pass |
| Frontend build | `cd frontend && npm run build` | ✅ pass (238 modules, `dist/` built in ~7 s; only the pre-existing chunk-size warning) |
| Backend boots without MONGO_URI | `node server.js` (no `.env`) | ✅ pass — clear stderr error + exit 1 |
| Full API smoke test (local dev server) | `node backend/scripts/smoke-test.mjs` (in-memory MongoDB via `mongodb-memory-server`) | ✅ **39/39 PASS** — signup/login (admin allow-list + student), wrong-password reject, club create/join/leave/re-join, text post, comment, upvote, save + saved page, club request → admin approve → visible, pending club hidden from students, student sees only own requests, moderator assignment, moderator pin (pinned sorts first), announcement 403 for student / 201 for admin / visible to student, event create/register/update/cancel (cancelled still visible), report file/resolve, admin overview + users, student 403 on admin overview |
| Serverless entry smoke test | `node backend/scripts/smoke-serverless.mjs` (wraps the real `api/index.js` handler in node:http, in-memory MongoDB) | ✅ **8/8 PASS** — `/health`, signup, club request, announcements list, avatar upload → local path + file on disk + served back via GET `/uploads` 200, warm-handler second request (cached DB) |
| Seed scripts | `node backend/scripts/verify-seeds.mjs` | ✅ **11/11 PASS** — placeholder admin created (role admin, title Head CR, warning printed), demo clubs/announcement/events/posts seeded, re-runs idempotent, three env admins created with matching titles |
| No domain check | grep for `uos.edu.pk` / CollegeDomain in backend + frontend | ✅ none (only code comments stating "no domain check") |
| No leftover Community refs | grep `community` in backend + frontend src | ✅ only a CSS class name and one JSX comment |

## What is NOT verified
- **Real MongoDB Atlas / real deployment.** All DB tests used
  `mongodb-memory-server`. The Vercel projects have not been created and
  nothing has been deployed or pushed to GitHub (per the brief).
- **Google / GitHub OAuth end-to-end.** No real OAuth credentials exist, so
  the Google ID-token verify and the GitHub callback redirect were not
  exercised against Google/GitHub. The code paths are ported verbatim from
  Keshav's repo (which Hunny's team uses) and the endpoints are mounted;
  the smoke tests cover email/password auth only.
- **Cloudinary upload path.** No Cloudinary account/credentials exist, so
  the Cloudinary branch was not executed — only the local-disk branch was
  smoke-tested. The code is a thin wrapper around Harshit's `cloudinary.js`
  pattern; it must be tested once credentials are set.
- **Real browser / responsive check.** No live-browser run was done in this
  session (subagent has no browser). The frontend builds, and the new pages
  use responsive layouts — but desktop + mobile rendering, login in the
  browser, and the Google button rendering have not been eyeballed.
- **Socket.io real-time in local dev.** The refactor keeps Socket.io in
  `server.js`, but no socket client connected during tests (REST only).
- **DMs + AI summary.** Kept as-is from the Readit base; not exercised.

## What Hunny must supply (nothing is invented)
1. **The three real admin emails + which title belongs to whom** (Head CR,
   Head GR, HOD). Until then the seed creates the placeholder admin
   (`admin@campusconnect.local` / `changeme123`) — replace it before real use.
2. **MongoDB Atlas connection string** (`MONGO_URI`) — free M0 cluster.
   Also allow the Vercel backend IPs / `0.0.0.0/0` in Atlas Network Access.
3. **Google OAuth client ID** (`GOOGLE_CLIENT_ID` backend +
   `VITE_GOOGLE_CLIENT_ID` frontend, same value) — Google Cloud console,
   Web application type.
4. **GitHub OAuth app** (`GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`,
   `GITHUB_CALLBACK_URL` = `https://<backend-domain>/authentication/github/callback`)
   — and the same callback URL in the GitHub OAuth app settings.
5. **GitHub push + two Vercel projects** (roots `frontend/` and `backend/`),
   with the env vars from §2 of the README deployment section. (Owner's
   step — the build agent does not deploy or push.)
6. **Cloudinary account** (`CLOUDINARY_CLOUD_NAME` / `API_KEY` /
   `API_SECRET`) — only needed if uploads must work in production; local
   dev works without it.
7. **Decisions still open** (defaults are in the plan §12): doc storage is
   now "local dev + Cloudinary in production" (wired); DMs + AI summary
   kept as-is; event categories are workshop/seminar/competition/department;
   club creation is "anyone requests, admin approves".

## How to run it locally
```bash
cd backend && npm install && cp .env.example .env   # fill MONGO_URI, JWT_SECRET
node scripts/seedAdmin.js        # placeholder admin (or set ADMIN_EMAILS first)
node scripts/seedDemo.js         # optional demo data
node server.js                   # http://localhost:5000
cd ../frontend && npm install && npm run dev   # http://localhost:5173
# tests:
node backend/scripts/smoke-test.mjs            # 39 checks, in-memory MongoDB
node backend/scripts/smoke-serverless.mjs      # 8 checks, Vercel entry
node backend/scripts/verify-seeds.mjs          # 11 checks
```

## Files added / changed (working copy)
- **New backend:** `app.js`, `db.js`, `cloudinary.js`, `api/index.js`,
  `vercel.json`, `Models/ClubRequest.js`, `Models/Report.js`,
  `Models/Announcement.js`, `Models/Event.js`, `Models/Registration.js`,
  `Controllers/ClubRequestController.js`, `Controllers/ReportController.js`,
  `Controllers/AnnouncementController.js`, `Controllers/EventController.js`,
  `Controllers/AdminController.js`, `Middleware/requireRole.js`,
  `Routers/ClubRequestRouter.js`, `Routers/ReportRouter.js`,
  `Routers/AnnouncementRouter.js`, `Routers/EventRouter.js`,
  `Routers/AdminRouter.js`, `scripts/seedAdmin.js`, `scripts/seedDemo.js`,
  `scripts/smoke-test.mjs`, `scripts/smoke-serverless.mjs`,
  `scripts/verify-seeds.mjs`, `.env.example`.
- **Rewritten backend:** `server.js`, `Controllers/AuthController.js`,
  `Controllers/ClubController.js`, `Controllers/PostController.js`,
  `Controllers/CommentController.js`, `Models/User.js`, `Models/Club.js`,
  `Models/Post.js`, `Routers/UploadRouter.js` (Cloudinary + upload-dir fix),
  `Routers/AuthRouter.js`, `Routers/ClubRouter.js`, `Routers/PostRouter.js`.
- **New frontend:** `pages/AdminPanel/`, `pages/Events/` (EventsPage,
  EventForm), `pages/SavedPage/`, `pages/Announcements/AnnouncementCard`,
  `components/Moderation/` (ReportDialog, ModeratorQueue),
  `components/Authentication/OAuthButtons`, `components/Club/ClubRequestForm`,
  `src/utils/mediaUrl.js`, `frontend/.env.example`.
- **Changed frontend:** `routes.jsx` (`/admin`, `/events`, `/saved`),
  `Navbar` (Events/Saved/Admin links), `HomePage` (announcements section),
  `ClubPage` (moderator tools + queue), `ExplorePage` (request-a-club),
  `Login`/`Signup` (OAuth buttons), `PostCard` (pin/report/moderation),
  `CreatePostForm` (type fix + Link tab + attachments),
  `AnnouncementCard` (media URL resolver), Tailwind setup,
  `PostPage.jsx` (base syntax repair).
- **Docs:** `README.md`, `BUILD_REPORT.md` (this file), `.gitignore`
  (extended), `git init` done, no commit (first commit left for the owner).
