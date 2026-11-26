// Dev-only verification for the seed scripts (seedAdmin.js, seedDemo.js).
// Starts an in-memory MongoDB, runs the seeds as child processes, and checks
// the resulting documents. Run:  node scripts/verify-seeds.mjs
import { MongoMemoryServer } from "mongodb-memory-server";
import { spawn } from "node:child_process";
import mongoose from "mongoose";
import User from "../Models/User.js";
import Club from "../Models/Club.js";
import Post from "../Models/Post.js";
import Announcement from "../Models/Announcement.js";
import Event from "../Models/Event.js";

let failures = 0;
function check(name, ok, detail = "") {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failures++;
}

function runSeed(script, env) {
  return new Promise((resolve, reject) => {
    const p = spawn("node", [`scripts/${script}`], {
      cwd: new URL("..", import.meta.url).pathname,
      env: { ...process.env, ...env },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let out = "";
    p.stdout.on("data", (d) => (out += d));
    p.stderr.on("data", (d) => (out += d));
    p.on("close", (code) => resolve({ code, out }));
    p.on("error", reject);
  });
}

async function main() {
  const mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  const base = { MONGO_URI: uri, HASHING: "4" };

  // 1. Placeholder admin (no ADMIN_EMAILS set).
  let r = await runSeed("seedAdmin.js", base);
  check("seedAdmin (placeholder) exits 0", r.code === 0, `code=${r.code}`);
  await mongoose.connect(uri);
  let admin = await User.findOne({ email: "admin@campusconnect.local" });
  check(
    "placeholder admin created",
    !!admin && admin.role === "admin" && admin.adminTitle === "Head CR",
    `role=${admin?.role} title=${admin?.adminTitle}`
  );
  check("placeholder warning printed", /WARNING|placeholder/i.test(r.out));

  // 2. Demo data (owned by the placeholder admin).
  r = await runSeed("seedDemo.js", base);
  check("seedDemo exits 0", r.code === 0, `code=${r.code}`);
  check("demo clubs seeded", (await Club.countDocuments({ status: "approved" })) >= 2);
  check("demo announcement seeded", (await Announcement.countDocuments()) >= 1);
  check("demo events seeded (upcoming + past)", (await Event.countDocuments()) >= 2);
  check("demo posts seeded", (await Post.countDocuments()) >= 1);

  // 3. Idempotency: run both again, counts must not grow.
  const countsBefore = {
    users: await User.countDocuments(),
    clubs: await Club.countDocuments(),
    events: await Event.countDocuments(),
  };
  await runSeed("seedAdmin.js", base);
  await runSeed("seedDemo.js", base);
  check(
    "seeds are idempotent",
    (await User.countDocuments()) === countsBefore.users &&
      (await Club.countDocuments()) === countsBefore.clubs &&
      (await Event.countDocuments()) === countsBefore.events
  );

  // 4. Real admins from env (fresh DB namespace via separate run is overkill;
  //    verify the env path creates the three personas on top of the same DB).
  r = await runSeed("seedAdmin.js", {
    ...base,
    ADMIN_EMAILS: "cr@test.local,gr@test.local,hod@test.local",
    ADMIN_TITLES: "Head CR,Head GR,HOD",
    ADMIN_PASSWORD: "secret123",
  });
  check("seedAdmin (env admins) exits 0", r.code === 0, `code=${r.code}`);
  const admins = await User.find({ role: "admin" }).select("email adminTitle");
  const titles = admins.map((a) => `${a.email}:${a.adminTitle}`).sort();
  check(
    "three env admins created with matching titles",
    titles.includes("cr@test.local:Head CR") &&
      titles.includes("gr@test.local:Head GR") &&
      titles.includes("hod@test.local:HOD"),
    titles.join(", ")
  );

  await mongoose.disconnect();
  await mongod.stop();
  console.log(failures === 0 ? "\nALL SEED CHECKS PASSED" : `\n${failures} SEED CHECK(S) FAILED`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error("Seed verification crashed:", err);
  process.exit(1);
});
