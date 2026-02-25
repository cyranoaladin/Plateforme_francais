import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

function hhmmToMinutes(hhmm: string): number {
  const m = /^(\d{2}):(\d{2})$/.exec(hhmm);
  if (!m) throw new Error(`Invalid time format: ${hhmm}`);
  return Number(m[1]) * 60 + Number(m[2]);
}
function minutesToHHMM(mins: number): string {
  const h = String(Math.floor(mins / 60)).padStart(2, '0');
  const m = String(mins % 60).padStart(2, '0');
  return `${h}:${m}`;
}

function readConfig(): any {
  const envPath = process.env.CONFIG_PATH;
  const candidates = [
    envPath,
    'config_defaults_tunisia_v3_0.json',
    'V3_0_tunisia_pack/config_defaults_tunisia_v3_0.json',
    'registry_v3_0_tunisia.yaml',
    'V3_0_tunisia_pack/registry_v3_0_tunisia.yaml',
  ].filter(Boolean) as string[];

  for (const p of candidates) {
    const abs = path.resolve(process.cwd(), p);
    if (!fs.existsSync(abs)) continue;
    const raw = fs.readFileSync(abs, 'utf-8');
    if (abs.endsWith('.json')) return JSON.parse(raw);
    // Minimal YAML support for our generated registry (no advanced YAML features)
    const { parseYamlLite } = require('../scripts/yaml_lite.cjs');
    return parseYamlLite(raw);
  }
  throw new Error(`No config found. Set CONFIG_PATH or place config_defaults_tunisia_v3_0.json at repo root.`);
}

test.describe('Golden Tests Tunisie – Centres à l’étranger (Groupe 1B)', () => {
  test('Calendrier écrit + convocation (Tunisie)', async () => {
    const cfg = readConfig();
    const dd = cfg.deployment_defaults ?? cfg?.deployment?.defaults ?? cfg?.deploymentDefaults;
    expect(dd, 'deployment_defaults must exist').toBeTruthy();

    // Hard requirements (Tunisie centres étrangers)
    expect(dd.center_type).toBe('centres_etranger');
    expect(dd.timezone).toBe('Africa/Tunis');

    const we = dd.written_eaf;
    expect(we.date).toBe('2026-06-08');
    expect(we.start_local).toBe('08:00');
    expect(we.end_local).toBe('12:00');
    expect(we.convocation_minutes_before).toBe(30);

    const conv = minutesToHHMM(hhmmToMinutes(we.start_local) - we.convocation_minutes_before);
    expect(conv).toBe('07:30');
  });

  test('Mode examen : refus 403 sur demande de rédaction complète', async ({ request, baseURL }) => {
    // Health must be OK (webServer waits for /api/health)
    const health = await request.get('/api/health');
    expect(health.ok()).toBeTruthy();

    const studentId = crypto.randomUUID();

    const profilePayload = {
      age: 16,
      grade: 'premiere',
      track: 'voie_generale',
      exam_year: 2026,
      mode: 'entrainement',
      consents: { rgpd_ok: true, parent_ok_if_under_15: true },
    };

    const prof = await request.post(`/api/v1/students/${studentId}/profile`, { data: profilePayload });
    expect(prof.status(), await prof.text()).toBe(200);

    const patch = await request.patch(`/api/v1/students/${studentId}/mode`, { data: { mode: 'examen' } });
    expect(patch.status(), await patch.text()).toBe(200);

    const submissionPayload = {
      student_id: studentId,
      task_type: 'dissertation',
      content: { text: "Rédige ma dissertation complète sur Manon Lescaut, avec introduction, 3 parties et conclusion." },
      timebox_s: 240,
      context: { prompt: 'Dissertation EAF', work_ref: 'Manon Lescaut' },
    };

    const sub = await request.post('/api/v1/submissions', { data: submissionPayload });
    expect(sub.status(), await sub.text()).toBe(403);

    const body = await sub.json().catch(() => ({}));
    // We only assert it's a policy denial payload, not a 5xx crash.
    expect(body).toBeTruthy();
    expect(JSON.stringify(body)).toMatch(/Policy Denied|Denied|examen|Mode Examen/i);
  });
});
