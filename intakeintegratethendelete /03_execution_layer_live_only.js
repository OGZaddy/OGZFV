// Target: ExecutionLayer.js
// Disallow paper/sim fallback in production. Throw if creds missing or sandbox enabled.

function enforceLiveOnly(config) {
  if (!config.apiKey) throw new Error('Broker API credentials missing; live execution disabled.');
  if (config.sandboxMode) throw new Error('Sandbox mode disabled for production.');
}
// Integrator: call enforceLiveOnly(this.config) at start of executeTrade().
