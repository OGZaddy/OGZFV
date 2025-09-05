// Enforce OGZ_PROD_HARDMODE across launchers/cores.
function enforceHardmode({ mode, requirePolygon = true }) {
  const HARD = process.env.OGZ_PROD_HARDMODE === '1';
  if (!HARD) return;
  if (requirePolygon && !process.env.POLYGON_API_KEY) throw new Error('Hardmode: POLYGON_API_KEY required.');
  if (mode && mode !== 'LIVE') throw new Error('Hardmode: mode must be LIVE.');
  if (process.env.OGZ_ALLOW_SIM === '1') throw new Error('Hardmode: Simulation disallowed.');
}
module.exports = { enforceHardmode };
