const mandatoryVars = [
  'DATABASE_URL',
  'MISTRAL_API_KEY',
  'SESSION_SECRET',
  'NEXT_PUBLIC_API_URL',
];

let missing = 0;
mandatoryVars.forEach(v => {
  if (!process.env[v]) {
    console.error(`[CRITICAL] Missing environment variable: ${v}`);
    missing++;
  }
});

if (missing > 0) {
  console.error(`\nFAIL: ${missing} mandatory variable(s) missing. Check .env.local`);
  process.exit(1);
} else {
  console.log('Environment configuration: OK');
  process.exit(0);
}
