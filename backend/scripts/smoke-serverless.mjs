// Dev-only smoke test for the Vercel serverless entry (backend/api/index.js).
// Wraps the exported handler in a plain node:http server and exercises the
// key flows against it, proving the serverless path (no app.listen, no
// Socket.io, cached DB connect) works. Run:  node scripts/smoke-serverless.mjs
import { MongoMemoryServer } from "mongodb-memory-server";
import http from "node:http";
import fs from "node:fs";

const PORT = 5002;
const BASE = `http://127.0.0.1:${PORT}`;

let failures = 0;
function check(name, ok, detail = "") {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failures++;
}

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

async function req(method, path, jar, body, isForm = false) {
  const headers = { ...(jar ? { Cookie: jar.header() } : {}) };
  let payload;
  if (body) {
    if (isForm) {
      payload = body; // FormData sets its own content-type
    } else {
      headers["Content-Type"] = "application/json";
      payload = JSON.stringify(body);
    }
  }
  const res = await fetch(`${BASE}${path}`, { method, headers, body: payload });
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

async function main() {
  const mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();

  // Env the serverless handler reads (as Vercel would provide them).
  process.env.MONGO_URI = uri;
  process.env.JWT_SECRET = "serverless-smoke-secret";
  process.env.HASHING = "4";
  process.env.FRONTEND_URL = "http://localhost:5173";
  process.env.NODE_ENV = "production";

  // Import the real Vercel entry. No app.listen is called by it.
  const { default: handler } = await import("../api/index.js");

  const server = http.createServer((req, res) => handler(req, res));
  await new Promise((resolve) => server.listen(PORT, resolve));
  console.log(`Serverless handler wrapped on port ${PORT}`);

  try {
    // Health endpoint (no DB needed).
    let r = await req("GET", "/health");
    check("GET /health returns ok", r.status === 200 && r.data?.ok === true, `status ${r.status}`);

    const jar = new Jar();
    r = await req("POST", "/authentication/signup", jar, {
      username: "srvless",
      email: "srvless@test.local",
      password: "password123",
    });
    check("signup via serverless handler", r.status === 200 || r.status === 201, `status ${r.status}`);

    r = await req("POST", "/clubs", jar, {
      name: "serverless-club",
      title: "Serverless Club",
      description: "Created through the Vercel entry.",
    });
    // Student (non-admin) signup creates a pending club + request.
    check("club request via serverless handler", r.status === 201 && r.data?.status === "pending", `status ${r.status}`);

    r = await req("GET", "/announcements", jar);
    check("announcements list via serverless handler", r.status === 200 && Array.isArray(r.data), `status ${r.status}`);

    // Upload without Cloudinary configured -> local path, file on disk.
    const form = new FormData();
    form.append(
      "avatar",
      new Blob(["fake-png-bytes"], { type: "image/png" }),
      "avatar.png"
    );
    r = await req("POST", "/upload/avatar", jar, form, true);
    const avatarUrl = r.data?.avatarUrl;
    check(
      "avatar upload returns local path (no Cloudinary)",
      r.status === 200 && typeof avatarUrl === "string" && avatarUrl.startsWith("/uploads/avatars/"),
      `status ${r.status} url=${avatarUrl}`
    );
    if (avatarUrl) {
      // The file must land in backend/Uploads/ (capital — the folder the
      // static mount serves) and be retrievable via GET /uploads/... .
      const diskPath = new URL(
        `../Uploads${avatarUrl.replace("/uploads", "")}`,
        import.meta.url
      ).pathname;
      check("uploaded file exists on local disk", fs.existsSync(diskPath), diskPath);
      const served = await fetch(`${BASE}${avatarUrl}`);
      check("uploaded file is served back via /uploads", served.status === 200, `GET status ${served.status}`);
      fs.unlinkSync(diskPath);
    }

    // Second request reuses the warm handler (cached DB connection).
    r = await req("GET", "/clubs", jar);
    check("second request works (warm handler, cached DB)", r.status === 200, `status ${r.status}`);
  } finally {
    server.close();
    await mongod.stop();
  }

  console.log(failures === 0 ? "\nALL SERVERLESS SMOKE TESTS PASSED" : `\n${failures} SERVERLESS SMOKE TEST(S) FAILED`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error("Serverless smoke test crashed:", err);
  process.exit(1);
});
