Lot 3: Atelier oral frontend refactor
1. Extract shared state logic from `atelier-oral/page.tsx` into a `useOralSession` hook; keep the hook responsible for current phase, timers (prep/passage), voiceMode persistence, jury turns, CSRF/header, session payload, and API calls.
2. Build presentational components under `src/app/atelier-oral/components/`: `OralWorkSelector`, `OralPrepPhase`, `OralPassagePhase`, `OralResultsPanel`, `OralChecklistWarning`.
3. Add a new `useVoiceMode` hook for reading/writing `VOICE_MODE_STORAGE_KEY`; add TTL cleanup for `prepChecklist` entries in localStorage.
4. Filter programme list for placeholders, surface banner if 2026-2027 data still stubbed, and re-use `getOeuvresForYear` from data.
5. Update tests (existing ones + new ones) to cover the hook behavior and component rendering, ensuring CSRF/token usage continues to work.
