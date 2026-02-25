/**
 * PolicyGate Agent — pre/post compliance checks.
 * Enforces: R-SCOPE-01, R-AIACT-01, R-RGPD-01, R-FRAUD-01, R-INJ-01
 *
 * B1 contract:
 *  - Pre-policy blocks full-production intent in exam mode (patterns + structured length).
 *  - Post-policy checks actual content length, not JSON wrapper.
 *  - All denials return standardized { error, rule, reason, mode }.
 *  - Denials log at INFO/WARN level (no stacktrace).
 *  - Legitimate method help (plans, problématiques, corrections) MUST pass.
 */

import { logger } from "@/lib/logger";

export type PolicyDecision = {
  allowed: boolean;
  rule?: string;
  reason?: string;
  mode?: string;
  log: Record<string, unknown>;
};

/**
 * Build a standardized denial payload (used by API routes for 403 responses).
 */
export function buildDenialPayload(decision: PolicyDecision): {
  error: string;
  rule: string;
  reason: string;
  mode: string;
} {
  return {
    error: "Policy Denied",
    rule: decision.rule || "UNKNOWN",
    reason: decision.reason || "Requête refusée par la politique de conformité.",
    mode: decision.mode || "unknown",
  };
}

// ── Pattern lists ────────────────────────────────────────────

const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?previous/i,
  /ignore\s+(all\s+)?instructions/i,
  /forget\s+(all\s+)?rules/i,
  /you\s+are\s+now/i,
  /system\s*:\s*/i,
  /\[INST\]/i,
  /<<SYS>>/i,
];

/**
 * Patterns that indicate a request for COMPLETE production (not method help).
 * These are checked ONLY in exam mode.
 * Carefully scoped to avoid false positives on legitimate help requests like
 * "donne-moi une problématique" or "aide-moi à corriger ma conclusion".
 */
const FULL_PRODUCTION_PATTERNS = [
  /r[ée]dige[sz]?\s+(ma|mon|la|le|une?|tout)\s+(dissertation|commentaire|copie|devoir|texte)/i,
  /[ée]cri[st]?\s+(ma|mon|la|le|une?|tout)\s+(dissertation|commentaire|copie|devoir|texte)/i,
  /g[ée]n[èe]re[sz]?\s+(ma|mon|la|le|une?|tout)\s+(dissertation|commentaire|copie|devoir|texte)/i,
  /fai[st]?\s+(ma|mon|la|le|une?|tout)\s+(dissertation|commentaire|copie|devoir)/i,
  /production\s+compl[èe]te/i,
  /texte\s+complet/i,
  /de\s+a\s+[àa]\s+z/i,
  /sans\s+rien\s+omettre/i,
  /int[ée]gralit[ée]\s+(du|de\s+la|des|de\s+mon)/i,
  /tout\s+le\s+texte/i,
  /r[ée]daction\s+compl[èe]te/i,
  /corrig[ée]\s+complet/i,
  /introduction\s*\+\s*\d+\s*parti/i,
  /fais\s+(la|le)\s+copie/i,
];

/**
 * Exam-mode input length threshold.
 * Set at 800 chars to avoid false positives on legitimate method requests
 * (a typical "donne-moi 2 plans possibles" is ~50-200 chars).
 * A structured production request ("introduction + 3 parties + conclusion + citations")
 * typically exceeds 800 chars.
 */
const EXAM_INPUT_LENGTH_THRESHOLD = 800;

/**
 * Post-policy output content length threshold for exam mode.
 * Applied to the actual text/content field, NOT the full JSON response.
 */
const EXAM_OUTPUT_CONTENT_THRESHOLD = 2500;

const EMOTION_KEYWORDS = [
  "stress",
  "anxiété",
  "anxieux",
  "anxieuse",
  "confiance détectée",
  "motivation détectée",
  "attention détectée",
  "état émotionnel",
  "analyse émotionnelle",
  "proctoring",
  "surveillance comportement",
];

// ── Pre-policy ───────────────────────────────────────────────

/**
 * Pre-request policy check.
 */
export function checkPrePolicy(input: {
  userInput: string;
  track?: string;
  mode?: string;
  age?: number;
  parentConsent?: boolean;
}): PolicyDecision {
  const mode = input.mode || "entrainement";

  // R-SCOPE-01: voie générale uniquement
  if (input.track && input.track !== "voie_generale") {
    return deny("R-SCOPE-01", "Seule la voie générale est supportée.", mode, {
      reason: "track_not_supported",
      track: input.track,
    });
  }

  // R-RGPD-01: consentement mineurs < 15 ans
  if (input.age !== undefined && input.age < 15 && !input.parentConsent) {
    return deny(
      "R-RGPD-01",
      "Le consentement parental est requis pour les élèves de moins de 15 ans (LIL art. 45).",
      mode,
      { reason: "needs_parent_consent", student_age: input.age }
    );
  }

  // R-INJ-01: prompt injection detection
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(input.userInput)) {
      return deny("R-INJ-01", "Requête non conforme détectée.", mode, {
        reason: "prompt_injection_pattern",
        pattern: pattern.source,
      });
    }
  }

  // R-FRAUD-01: mode examen — block full-production requests
  if (mode === "examen") {
    const isFullProduction = FULL_PRODUCTION_PATTERNS.some((p) =>
      p.test(input.userInput)
    );
    if (isFullProduction) {
      return deny(
        "R-FRAUD-01",
        "En mode examen, la génération de production complète est interdite.",
        mode,
        { reason: "full_production_in_exam_mode", inputLength: input.userInput.length }
      );
    }

    // Block structured long inputs that are manifestly production requests
    if (input.userInput.length > EXAM_INPUT_LENGTH_THRESHOLD) {
      return deny(
        "R-FRAUD-01",
        "En mode examen, les soumissions longues sont limitées. Seuls les plans et brouillons courts sont autorisés.",
        mode,
        { reason: "long_input_in_exam_mode", inputLength: input.userInput.length, threshold: EXAM_INPUT_LENGTH_THRESHOLD }
      );
    }
  }

  return { allowed: true, mode, log: { rule: "policy_gate", action: "allow" } };
}

// ── Post-policy ──────────────────────────────────────────────

/**
 * Post-response policy check — validates LLM output before sending to user.
 * Checks the actual content text, not the full JSON wrapper.
 */
export function checkPostPolicy(output: {
  text: string;
  mode?: string;
  contentField?: string;
}): PolicyDecision {
  const mode = output.mode || "entrainement";

  // R-AIACT-01: no emotion inference
  const lowerText = output.text.toLowerCase();
  for (const keyword of EMOTION_KEYWORDS) {
    if (lowerText.includes(keyword)) {
      return deny("R-AIACT-01", "La réponse contient une inférence émotionnelle interdite (AI Act).", mode, {
        reason: "emotion_inference",
        keyword,
      });
    }
  }

  // R-FRAUD-01: mode examen — block long content generation
  if (mode === "examen") {
    const contentToCheck = output.contentField || output.text;
    if (contentToCheck.length > EXAM_OUTPUT_CONTENT_THRESHOLD) {
      return deny(
        "R-FRAUD-01",
        "En mode examen, la génération longue est interdite. Seuls les consignes et plans sont autorisés.",
        mode,
        { reason: "long_generation_in_exam_mode", contentLength: contentToCheck.length, threshold: EXAM_OUTPUT_CONTENT_THRESHOLD }
      );
    }
  }

  return { allowed: true, mode, log: { rule: "policy_gate_post", action: "allow" } };
}

// ── Internal helpers ─────────────────────────────────────────

function deny(
  rule: string,
  reason: string,
  mode: string,
  extra: Record<string, unknown>
): PolicyDecision {
  logger.warn({ route: "policy-gate", rule, mode, ...extra }, "Policy gate deny.");
  return {
    allowed: false,
    rule,
    reason,
    mode,
    log: { rule, action: "deny", ...extra },
  };
}
