/**
 * Tunisia V3.0 Configuration Loader
 * Enforces: timezone Africa/Tunis, groupe 1B, 08/06/2026 08:00-12:00
 * Non-negotiable values from the BO.
 */

import { promises as fs } from "fs";
import path from "path";

export type TunisiaConfig = {
  jurisdiction: {
    country: string;
    country_name: string;
    center_type: string;
    group: string;
    group_label: string;
    academie_rattachement: string;
    timezone: string;
    utc_offset: string;
  };
  written_eaf: {
    date: string;
    day_label: string;
    start_local: string;
    end_local: string;
    duration_minutes: number;
    convocation_minutes_before: number;
    convocation_local: string;
    coefficient: number;
    iso_start: string;
    iso_end: string;
    iso_convocation: string;
  };
  oral_eaf: {
    date: string | null;
    date_status: string;
    date_note: string;
    coefficient: number;
    admin_configurable: boolean;
  };
  mandatory_simulations: Array<{
    id: string;
    label: string;
    days_before_exam: number;
    date: string;
    type: string;
    duration_minutes: number;
    start_local: string;
    end_local: string;
    required: boolean;
  }>;
  exam_mode_policy: {
    block_full_production: boolean;
    max_generation_chars: number;
    enforce_timebox: boolean;
    no_pause: boolean;
    no_exit: boolean;
    reject_status_code: number;
    reject_message: string;
  };
};

let _cachedConfig: TunisiaConfig | null = null;

/**
 * Load the Tunisia config from the JSON file.
 * Caches after first load.
 */
export async function loadTunisiaConfig(): Promise<TunisiaConfig> {
  if (_cachedConfig) return _cachedConfig;

  const configPath = process.env.CONFIG_PATH || path.join(
    process.cwd(),
    ".antigravity",
    "config_defaults_tunisia_v3_0.json"
  );

  try {
    const raw = await fs.readFile(configPath, "utf8");
    const parsed = JSON.parse(raw) as TunisiaConfig;
    _cachedConfig = parsed;
    return parsed;
  } catch {
    // Return hardcoded defaults if file not found
    return getHardcodedDefaults();
  }
}

/**
 * Get the hardcoded Tunisia defaults.
 * These are non-negotiable values from the BO.
 */
export function getHardcodedDefaults(): TunisiaConfig {
  return {
    jurisdiction: {
      country: "TN",
      country_name: "Tunisie",
      center_type: "centres_etranger",
      group: "1B",
      group_label: "Centres étrangers groupe 1(B)",
      academie_rattachement: "Aix-Marseille",
      timezone: "Africa/Tunis",
      utc_offset: "+01:00",
    },
    written_eaf: {
      date: "2026-06-08",
      day_label: "Lundi 8 juin 2026",
      start_local: "08:00",
      end_local: "12:00",
      duration_minutes: 240,
      convocation_minutes_before: 30,
      convocation_local: "07:30",
      coefficient: 5,
      iso_start: "2026-06-08T08:00:00+01:00",
      iso_end: "2026-06-08T12:00:00+01:00",
      iso_convocation: "2026-06-08T07:30:00+01:00",
    },
    oral_eaf: {
      date: null,
      date_status: "a_planifier",
      date_note: "Le calendrier des oraux dans les centres étrangers est fixé par le recteur de l'académie de rattachement (Aix-Marseille), à partir des propositions locales.",
      coefficient: 5,
      admin_configurable: true,
    },
    mandatory_simulations: [
      {
        id: "sim_j21",
        label: "Simulation J-21",
        days_before_exam: 21,
        date: "2026-05-18",
        type: "simulation_bac",
        duration_minutes: 240,
        start_local: "08:00",
        end_local: "12:00",
        required: true,
      },
      {
        id: "sim_j7",
        label: "Simulation J-7",
        days_before_exam: 7,
        date: "2026-06-01",
        type: "simulation_bac",
        duration_minutes: 240,
        start_local: "08:00",
        end_local: "12:00",
        required: true,
      },
    ],
    exam_mode_policy: {
      block_full_production: true,
      max_generation_chars: 3000,
      enforce_timebox: true,
      no_pause: true,
      no_exit: true,
      reject_status_code: 403,
      reject_message: "En mode examen, la génération de production complète est interdite (R-FRAUD-01).",
    },
  };
}

/**
 * Get the current date string (YYYY-MM-DD) in Africa/Tunis timezone.
 * Uses Intl.DateTimeFormat to avoid dependency on machine timezone.
 */
export function getNowInTunis(nowOverride?: Date): { dateStr: string; timeStr: string } {
  const now = nowOverride || new Date();
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Tunis",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const timeFormatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Tunis",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return {
    dateStr: formatter.format(now),
    timeStr: timeFormatter.format(now),
  };
}

/**
 * Compute days remaining until the written EAF exam.
 * Timezone-safe: compares dates in Africa/Tunis, not machine tz.
 */
export function getDaysUntilExam(config: TunisiaConfig, nowOverride?: Date): number {
  const { dateStr: todayStr } = getNowInTunis(nowOverride);
  const examDateStr = config.written_eaf.date;
  const today = new Date(todayStr + "T00:00:00Z");
  const exam = new Date(examDateStr + "T00:00:00Z");
  const diffMs = exam.getTime() - today.getTime();
  return Math.max(0, Math.ceil(diffMs / 86400000));
}

/**
 * Check if a mandatory simulation is due.
 * Timezone-safe: compares dates in Africa/Tunis.
 */
export function getUpcomingSimulations(
  config: TunisiaConfig,
  nowOverride?: Date
): Array<{ id: string; label: string; date: string; daysUntil: number; overdue: boolean }> {
  const { dateStr: todayStr } = getNowInTunis(nowOverride);
  const today = new Date(todayStr + "T00:00:00Z");
  return config.mandatory_simulations.map((sim) => {
    const simDate = new Date(sim.date + "T00:00:00Z");
    const diffMs = simDate.getTime() - today.getTime();
    const daysUntil = Math.ceil(diffMs / 86400000);
    return {
      id: sim.id,
      label: sim.label,
      date: sim.date,
      daysUntil,
      overdue: daysUntil < 0,
    };
  });
}

/**
 * Compute the "next best action" phase based on days until exam.
 * C1: Dashboard phase logic.
 */
export type ExamPhase = "fondations" | "simulation_1" | "simulation_2" | "jour_j";

export function getExamPhase(daysUntilExam: number): {
  phase: ExamPhase;
  label: string;
  action: string;
} {
  if (daysUntilExam > 21) {
    return {
      phase: "fondations",
      label: "Phase Fondations",
      action: "Priorité : mini-séances quotidiennes (10-20 min), construire la SkillMap, alimenter l'ErrorBank.",
    };
  }
  if (daysUntilExam > 7) {
    return {
      phase: "simulation_1",
      label: "Phase Simulation 1",
      action: "Simulation J-21 obligatoire (4h conditions réelles). Corriger et analyser les erreurs.",
    };
  }
  if (daysUntilExam >= 1) {
    return {
      phase: "simulation_2",
      label: "Phase Simulation 2",
      action: "Simulation J-7 obligatoire. Stratégie temps, checklists méthodo, révision ErrorBank.",
    };
  }
  return {
    phase: "jour_j",
    label: "Jour J",
    action: "Vérifier convocation (07:30), logistique, relecture fiches méthode. Pas de nouveau contenu.",
  };
}
