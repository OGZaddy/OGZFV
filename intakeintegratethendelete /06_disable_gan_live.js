// Target: OGZPrimeMasterBot / TimeGAN integrations
// Disable stochastic GAN in LIVE; allow GANN/TA only.

function filterGANInLive({ ganSignals, gannSignals, liveFlag }) {
  return liveFlag ? { ganSignals: null, gannSignals } : { ganSignals, gannSignals };
}
module.exports = { filterGANInLive };
