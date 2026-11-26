// Dev-only end-to-end smoke test for Campus Connect.
// Spins up an in-memory MongoDB, boots the real server, and exercises the
// key flows with HTTP requests. Run:  node scripts/smoke-test.mjs
// Requires the dev dependency mongodb-memory-server.
// Exits 0 when every check passes, 1 otherwise. Nothing is deployed.
import { MongoMemoryServer } from "mongodb-memory-server";
import { spawn } from "node:child_process";

const PORT = 5001;
const BASE = `http://127.0.0.1:${PORT}`;

let failures = 0;
function check(name, ok, detail = "") {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failures++;
}

// Minimal cookie jar: one per user.
class Jar {
  constructor() {
    this.cookies = {};
  }
  store(setCookie) {
    if (!setCookie) return;
    const list = Array.isArray(setCookie) ? setCookie : [setCookie];
    for (const c of list) {
      const [pair] = c.split(";");
      const [k, v] = pair.split("=");
      if (k && v !== undefined) this.cookies[k.trim()] = v.trim();
    }
  }
  header() {
    return Object.entries(this.cookies)
      .map(([k, v]) => `${k}=${v}`)
      .join("; ");
  }
}

async function req(method, path, jar, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(jar ? { Cookie: jar.header() } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data = null;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  if (jar) jar.store(res.headers.getSetCookie?.() || res.headers.get("set-cookie"));
  return { status: res.status, data };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitForServer(tries = 40) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(`${BASE}/posts/popular`);
      if (res.status) return true;
    } catch {
      /* not up yet */
    }
    await sleep(500);
  }
  return false;
}

async function main() {
  const mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  console.log("In-memory MongoDB:", uri);

  const server = spawn("node", ["server.js"], {
    cwd: new URL("..", import.meta.url).pathname,
    env: {
      ...process.env,
      PORT: String(PORT),
      MONGO_URI: uri,
      JWT_SECRET: "smoke-test-secret",
      HASHING: "4",
      FRONTEND_URL: "http://localhost:5173",
      ADMIN_EMAILS: "admin@test.local",
      ADMIN_TITLES: "Head CR",
      ADMIN_PASSWORD: "adminpass123",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  server.stdout.on("data", (d) => process.stdout.write(`[server] ${d}`));
  server.stderr.on("data", (d) => process.stdout.write(`[server:err] ${d}`));

  try {
    check("server boots", await waitForServer(), "port 5001");

    // --- Auth: admin (allow-listed) + student ---
    const adminJar = new Jar();
    const studentJar = new Jar();

    let r = await req("POST", "/authentication/signup", adminJar, {
      username: "headcr",
      email: "admin@test.local",
      password: "adminpass123",
    });
    // The base signup endpoint returns 200 (not 201) — accept either.
    check("admin signup (allow-list email)", r.status === 201 || r.status === 200, `status ${r.status}`);
    const adminId = r.data?.user?._id || r.data?._id;
    r = await req("GET", "/users/me", adminJar);
    check("admin role applied from ADMIN_EMAILS", r.data?.role === "admin", `role=${r.data?.role} title=${r.data?.adminTitle}`);

    r = await req("POST", "/authentication/signup", studentJar, {
      username: "student1",
      email: "student@test.local",
      password: "studentpass123",
    });
    check("student signup", r.status === 201 || r.status === 200, `status ${r.status}`);
    const studentId = r.data?.user?._id || r.data?._id;
    r = await req("GET", "/users/me", studentJar);
    check("student role is student", r.data?.role === "student", `role=${r.data?.role}`);

    // Wrong-password login must fail.
    const badJar = new Jar();
    r = await req("POST", "/authentication/login", badJar, {
      email: "student@test.local",
      password: "wrongpassword",
    });
    check("login rejects wrong password", r.status === 401 || r.status === 400, `status ${r.status}`);

    // --- Clubs: admin creates approved club; student joins/leaves ---
    r = await req("POST", "/clubs", adminJar, {
      name: "programming-club",
      title: "Programming Club",
      description: "All things code.",
    });
    check("admin creates club (approved)", r.status === 201 && r.data?.status === "approved", `status ${r.status} clubStatus=${r.data?.status}`);
    const clubId = r.data?._id;

    r = await req("POST", "/clubs/programming-club/join", studentJar);
    check("student joins club", r.status === 200 || r.status === 201, `status ${r.status}`);
    r = await req("DELETE", "/clubs/programming-club/leave", studentJar);
    check("student leaves club", r.status === 200, `status ${r.status}`);
    r = await req("POST", "/clubs/programming-club/join", studentJar);
    check("student re-joins club", r.status === 200 || r.status === 201, `status ${r.status}`);

    // --- Posts: create, comment, vote, pin, save ---
    r = await req("POST", "/posts", studentJar, {
      title: "Hello Campus Connect",
      content: "First post in the programming club.",
      type: "text",
      clubId,
    });
    check("student creates text post", r.status === 201, `status ${r.status}`);
    const postId = r.data?._id;

    r = await req("POST", `/posts/${postId}/comments`, studentJar, { content: "Great first post!" });
    check("student comments on post", r.status === 201 || r.status === 200, `status ${r.status}`);

    r = await req("POST", `/votes/posts/${postId}`, studentJar, { voteScore: 1 });
    check("student upvotes post", r.status === 200 || r.status === 201, `status ${r.status}`);

    r = await req("PATCH", `/posts/save/${postId}`, studentJar);
    check("student saves post", r.status === 200, `status ${r.status}`);
    r = await req("GET", "/posts/saved", studentJar);
    const saved = Array.isArray(r.data) ? r.data : r.data?.posts || [];
    check("saved page lists the post", saved.some((p) => (p._id || p.id) === postId), `saved=${saved.length}`);

    // --- Club request: student requests, admin approves ---
    r = await req("POST", "/clubs", studentJar, {
      name: "robotics-club",
      title: "Robotics Club",
      description: "Build robots.",
    });
    check("student club request creates pending club", r.status === 201 && r.data?.status === "pending", `status ${r.status} clubStatus=${r.data?.status}`);

    r = await req("GET", "/clubs", studentJar);
    const visible = Array.isArray(r.data) ? r.data : r.data?.results || r.data?.clubs || [];
    check("pending club hidden from students", !visible.some((c) => c.name === "robotics-club"), `listed=${visible.length}`);

    r = await req("GET", "/club-requests", adminJar);
    const pending = Array.isArray(r.data) ? r.data : [];
    const reqId = pending.find((x) => x.club?.name === "robotics-club")?._id;
    check("admin sees pending club request", !!reqId, `pending=${pending.length}`);
    if (reqId) {
      r = await req("POST", `/club-requests/${reqId}/approve`, adminJar);
      check("admin approves club request", r.status === 200, `status ${r.status}`);
    }
    r = await req("GET", "/clubs/robotics-club", studentJar);
    check("approved club now visible", r.status === 200 && r.data?.status === "approved", `status ${r.status}`);

    // Students CAN list requests — but only their own.
    r = await req("GET", "/club-requests", studentJar);
    const own = Array.isArray(r.data) ? r.data : [];
    check(
      "student sees only their own club requests",
      r.status === 200 &&
        own.length >= 1 &&
        own.every((x) => (x.user?._id || x.user) === studentId),
      `status ${r.status} own=${own.length}`
    );

    // --- Moderator assignment + pin ---
    r = await req("POST", "/clubs/programming-club/moderators", adminJar, { userId: studentId });
    check("admin assigns student as club moderator", r.status === 200 || r.status === 201, `status ${r.status}`);
    r = await req("POST", `/posts/${postId}/pin`, studentJar);
    check("club moderator pins post", r.status === 200, `status ${r.status}`);
    r = await req("GET", "/posts/club/programming-club", studentJar);
    const clubPosts = Array.isArray(r.data) ? r.data : [];
    check("pinned post sorts first", clubPosts[0]?._id === postId && clubPosts[0]?.pinned === true, `first=${clubPosts[0]?._id} pinned=${clubPosts[0]?.pinned}`);

    // --- Announcements ---
    r = await req("POST", "/announcements", studentJar, {
      title: "Should fail",
      content: "Students cannot announce.",
      category: "Important Updates",
    });
    check("student cannot create announcement", r.status === 403, `status ${r.status}`);

    r = await req("POST", "/announcements", adminJar, {
      title: "Midterm timetable released",
      content: "Check the notice board for the midterm schedule.",
      category: "Important Updates",
      link: "https://example.com/timetable",
    });
    check("admin creates announcement", r.status === 201, `status ${r.status}`);
    r = await req("GET", "/announcements", studentJar);
    const anns = Array.isArray(r.data) ? r.data : [];
    check("student sees announcement with date", anns.length >= 1 && !!anns[0]?.createdAt, `count=${anns.length}`);

    // --- Events: create, register, update, cancel ---
    const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    r = await req("POST", "/events", adminJar, {
      title: "Intro to React Workshop",
      description: "Hands-on React basics.",
      category: "workshop",
      date: tomorrow,
      time: "10:00 AM - 12:00 PM",
      venue: "CS Lab 1",
    });
    check("admin creates event", r.status === 201, `status ${r.status}`);
    const eventId = r.data?._id;

    r = await req("POST", `/events/${eventId}/register`, studentJar);
    check("student registers for event", r.status === 200 || r.status === 201, `status ${r.status}`);
    r = await req("GET", "/events?filter=upcoming", studentJar);
    const upcoming = Array.isArray(r.data) ? r.data : [];
    check("upcoming events list includes it", upcoming.some((e) => e._id === eventId), `upcoming=${upcoming.length}`);

    r = await req("PATCH", `/events/${eventId}`, adminJar, { venue: "CS Lab 2" });
    check("admin updates event", r.status === 200 && r.data?.venue === "CS Lab 2", `status ${r.status} venue=${r.data?.venue}`);

    r = await req("POST", `/events/${eventId}/cancel`, adminJar);
    // cancelEvent returns { message, event } — the status lives on .event.
    check("admin cancels event", r.status === 200 && r.data?.event?.status === "cancelled", `status ${r.status}`);
    r = await req("GET", "/events?filter=all", studentJar);
    const all = Array.isArray(r.data) ? r.data : [];
    check("cancelled event still visible (past/all)", all.some((e) => e._id === eventId && e.status === "cancelled"), `all=${all.length}`);

    // --- Reports: student reports, admin resolves ---
    r = await req("POST", "/reports", studentJar, {
      postId,
      reason: "spam",
      details: "Smoke-test report.",
    });
    check("student files a report", r.status === 201, `status ${r.status}`);
    const reportId = r.data?._id;
    r = await req("GET", "/reports", adminJar);
    const reports = Array.isArray(r.data) ? r.data : [];
    check("admin sees open report", reports.some((x) => x._id === reportId), `open=${reports.length}`);
    if (reportId) {
      r = await req("POST", `/reports/${reportId}/resolve`, adminJar, { action: "dismiss" });
      check("admin dismisses report", r.status === 200, `status ${r.status}`);
    }

    // --- Admin panel ---
    r = await req("GET", "/admin/overview", adminJar);
    check("admin overview counts", r.status === 200 && typeof r.data?.totalUsers === "number", `status ${r.status}`);
    r = await req("GET", "/admin/users", adminJar);
    check("admin lists users", r.status === 200, `status ${r.status}`);
    r = await req("GET", "/admin/overview", studentJar);
    check("student cannot open admin overview", r.status === 403, `status ${r.status}`);

    // --- Seed scripts ---
    console.log("Seed scripts are exercised separately (seedAdmin/seedDemo).");
    void adminId;
  } finally {
    server.kill("SIGTERM");
    await mongod.stop();
  }

  console.log(failures === 0 ? "\nALL SMOKE TESTS PASSED" : `\n${failures} SMOKE TEST(S) FAILED`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error("Smoke test crashed:", err);
  process.exit(1);
});
