// session.ts — When the current app session began. Used by the dashboard to
// compute the "before vs after this session" improvement. Captured once at load
// so it survives tab switches (component remounts).
export const SESSION_START = Date.now()
