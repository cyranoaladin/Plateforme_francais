const mandatoryVars = [
  'DATABASE_URL',
  'MISTRAL_API_KEY',
  'SESSION_SECRET',
  'NEXT_PUBLIC_API_URL',
  'BILLING_CODE_PEPPER',
  'MCP_API_KEY',
];

const FORBIDDEN_DEFAULTS = [
  'change_me_in_production',
  'changeme',
  'password',
  'secret',
  'admin',
];

let missing = 0;
let forbidden = 0;

mandatoryVars.forEach(v => {
  if (!process.env[v]) {
    console.error(`[CRITICAL] Missing environment variable: ${v}`);
    missing++;
  }
});

// H3 FIX: Vérifier que les clés ne sont pas les valeurs par défaut
['MCP_API_KEY', 'SESSION_SECRET', 'CSRF_SECRET', 'CRON_SECRET', 'BILLING_CODE_PEPPER'].forEach(v => {
  const val = process.env[v];
  if (val) {
    const lower = val.toLowerCase();
    if (FORBIDDEN_DEFAULTS.some(d => lower.includes(d)) || val.length < 16) {
      console.error(`[CRITICAL] ${v} appears to use a default or weak value. Please generate a secure random value.`);
      forbidden++;
    }
  }
});

if (missing > 0 || forbidden > 0) {
  console.error(`\nFAIL: ${missing} missing, ${forbidden} using default/weak values. Check .env.local`);
  process.exit(1);
} else {
  console.log('Environment configuration: OK');
  process.exit(0);
}
