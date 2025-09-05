// Express helper to serve ultdash.html as index
const path = require('path');
function attachDashboard(app, staticDir) {
  const entry = process.env.DASHBOARD_ENTRY || 'ultdash.html';
  app.use(require('express').static(staticDir, { maxAge: '1d' }));
  app.get('/', (_,res)=>res.sendFile(path.join(staticDir, entry)));
}
module.exports = { attachDashboard };
