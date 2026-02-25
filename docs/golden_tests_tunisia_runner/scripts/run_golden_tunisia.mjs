#!/usr/bin/env node
/**
 * Golden Tests Tunisie (Centres à l'étranger – Groupe 1B)
 * Validates:
 *  - Written EAF schedule: 2026-06-08 08:00–12:00 (Africa/Tunis)
 *  - Convocation: 07:30 (30 minutes before)
 *  - Exam mode refusal: POST /submissions must return 403 for "write full dissertation" style requests
 *
 * Usage:
 *   node scripts/run_golden_tunisia.mjs
 *
 * Env:
 *   CONFIG_PATH   Path to config JSON or registry YAML (default tries common files)
 *   BASE_URL      Server base URL (default http://localhost:3000)
 *   API_PREFIX    API prefix (default /api/v1)
 *   REQUIRE_SERVER=true   Fail if server is not reachable (default true)
 *
 * Notes:
 *  - This runner is CI-friendly and prints a single PASS/FAIL summary.
 *  - It does NOT infer emotions; it only verifies policy behavior.
 */

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import crypto from "node:crypto";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";
const API_PREFIX = process.env.API_PREFIX ?? "/api/v1";
const REQUIRE_SERVER = (process.env.REQUIRE_SERVER ?? "true").toLowerCase() === "true";

/** ---------- helpers ---------- */
const ok = (msg) => console.log(`✅ ${msg}`);
const warn = (msg) => console.warn(`⚠️  ${msg}`);
const fail = (msg) => { console.error(`❌ ${msg}`); throw new Error(msg); };

function hhmmToMinutes(hhmm) {
  const m = /^(\d{2}):(\d{2})$/.exec(hhmm);
  if (!m) throw new Error(`Invalid time format: ${hhmm}`);
  return Number(m[1]) * 60 + Number(m[2]);
}
function minutesToHHMM(mins) {
  const h = String(Math.floor(mins / 60)).padStart(2, "0");
  const m = String(mins % 60).padStart(2, "0");
  return `${h}:${m}`;
}

async function tryFetch(url, opts) {
  try {
    const res = await fetch(url, opts);
    return res;
  } catch (e) {
    return null;
  }
}

async function readConfigObject(configPath) {
  const ext = path.extname(configPath).toLowerCase();
  const raw = await fs.readFile(configPath, "utf-8");
  if (ext === ".json") return JSON.parse(raw);
  if (ext === ".yaml" || ext === ".yml") {
    // minimal YAML parser without deps: assume registry yaml is JSON-compatible subset.
    // If you use real YAML features, install 'yaml' and replace this block.
    // Here we keep it simple by requiring JSON-like YAML (safe in our generated packs).
    const { parse } = await import("./yaml_miniparser.mjs");
    return parse(raw);
  }
  throw new Error(`Unsupported config format: ${ext}`);
}

async function findConfigPath() {
  const envPath = process.env.CONFIG_PATH;
  if (envPath) return envPath;

  const candidates = [
    "config_defaults_tunisia_v3_0.json",
    "V3_0_tunisia_pack/config_defaults_tunisia_v3_0.json",
    "registry_v3_0_tunisia.yaml",
    "V3_0_tunisia_pack/registry_v3_0_tunisia.yaml",
    "registry_v3_0.yaml",
  ];

  for (const rel of candidates) {
    const abs = path.resolve(process.cwd(), rel);
    try {
      await fs.access(abs);
      return abs;
    } catch {}
  }
  throw new Error(
    `CONFIG_PATH not provided and no default config file found. Tried: ${candidates.join(", ")}`
  );
}

function extractTunisiaDefaults(cfg) {
  // Support both our JSON config_defaults and the registry yaml with deployment_defaults.
  const dd = cfg.deployment_defaults ?? cfg?.deployment?.defaults ?? cfg?.deploymentDefaults ?? null;
  if (dd) return dd;

  // In config_defaults_tunisia_v3_0.json, deployment_defaults is top-level.
  if (cfg?.deployment_defaults) return cfg.deployment_defaults;

  // In registry, we stored deployment_defaults under root.
  if (cfg?.deployment_defaults) return cfg.deployment_defaults;

  throw new Error("Cannot find deployment_defaults in config.");
}

async function assertTunisiaSchedule() {
  const configPath = await findConfigPath();
  const cfg = await readConfigObject(configPath);
  const dd = extractTunisiaDefaults(cfg);

  // Expected official values for Tunisia (centres étrangers groupe 1B)
  const expected = {
    center_type: "centres_etranger",
    timezone: "Africa/Tunis",
    written_date: "2026-06-08",
    start_local: "08:00",
    end_local: "12:00",
    convocation_minutes_before: 30,
  };

  if (dd.center_type !== expected.center_type) fail(`center_type mismatch: got ${dd.center_type}, expected ${expected.center_type}`);
  if (dd.timezone !== expected.timezone) fail(`timezone mismatch: got ${dd.timezone}, expected ${expected.timezone}`);
  if (!dd.written_eaf) fail("deployment_defaults.written_eaf missing");

  const we = dd.written_eaf;
  if (we.date !== expected.written_date) fail(`written date mismatch: got ${we.date}, expected ${expected.written_date}`);
  if (we.start_local !== expected.start_local) fail(`start_local mismatch: got ${we.start_local}, expected ${expected.start_local}`);
  if (we.end_local !== expected.end_local) fail(`end_local mismatch: got ${we.end_local}, expected ${expected.end_local}`);
  if (we.convocation_minutes_before !== expected.convocation_minutes_before) {
    fail(`convocation_minutes_before mismatch: got ${we.convocation_minutes_before}, expected ${expected.convocation_minutes_before}`);
  }

  const convocation = minutesToHHMM(hhmmToMinutes(we.start_local) - we.convocation_minutes_before);
  if (convocation !== "07:30") fail(`convocation time mismatch: got ${convocation}, expected 07:30`);

  ok(`Calendrier Tunisie validé (${we.date} ${we.start_local}–${we.end_local}, convocation ${convocation}, tz ${dd.timezone}).`);
  return { configPath, dd, convocation };
}

async function assertExamModeDenial() {
  // Require server
  const health = await tryFetch(`${BASE_URL}/api/health`, { method: "GET" });
  if (!health) {
    if (REQUIRE_SERVER) fail(`Server not reachable at ${BASE_URL}. Start Next.js first (npm run dev / npm run start).`);
    warn(`Server not reachable at ${BASE_URL}. Skipping exam-mode denial test.`);
    return;
  }
  if (!health.ok) fail(`/api/health returned ${health.status}`);
  ok(`/api/health OK (${health.status}).`);

  const studentId = crypto.randomUUID();
  const profilePayload = {
    age: 16,
    grade: "premiere",
    track: "voie_generale",
    exam_year: 2026,
    mode: "entrainement",
    consents: { rgpd_ok: true, parent_ok_if_under_15: true },
  };

  // Create profile
  const profRes = await fetch(`${BASE_URL}${API_PREFIX}/students/${studentId}/profile`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(profilePayload),
  });
  if (!profRes.ok) {
    const txt = await profRes.text().catch(() => "");
    fail(`Profile create failed (${profRes.status}). Body: ${txt.slice(0, 500)}`);
  }
  ok(`Profil créé (${studentId}).`);

  // Switch to exam mode
  const modeRes = await fetch(`${BASE_URL}${API_PREFIX}/students/${studentId}/mode`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ mode: "examen" }),
  });
  if (!modeRes.ok) {
    const txt = await modeRes.text().catch(() => "");
    fail(`Mode patch failed (${modeRes.status}). Body: ${txt.slice(0, 500)}`);
  }
  ok(`Mode examen activé.`);

  // Attempt forbidden request
  const submissionPayload = {
    student_id: studentId,
    task_type: "dissertation",
    content: { text: "Rédige ma dissertation complète sur Manon Lescaut, avec introduction, 3 parties, citations et conclusion." },
    timebox_s: 240,
    context: { prompt: "Dissertation EAF", work_ref: "Manon Lescaut" },
  };

  const subRes = await fetch(`${BASE_URL}${API_PREFIX}/submissions`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(submissionPayload),
  });

  if (subRes.status !== 403) {
    const txt = await subRes.text().catch(() => "");
    fail(`Expected 403 policy denial in exam mode, got ${subRes.status}. Body: ${txt.slice(0, 800)}`);
  }

  const body = await subRes.json().catch(() => ({}));
  const reason = body?.reason ?? body?.error ?? JSON.stringify(body).slice(0, 200);
  ok(`Refus mode examen OK (403). Reason: ${reason}`);
}

/** ---------- main ---------- */
(async function main() {
  try {
    await assertTunisiaSchedule();
    await assertExamModeDenial();
    console.log("\n✅ GOLDEN TESTS TUNISIE: PASS\n");
    process.exit(0);
  } catch (e) {
    console.error("\n❌ GOLDEN TESTS TUNISIE: FAIL\n");
    process.exit(1);
  }
})();
