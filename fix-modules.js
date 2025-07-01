// fix-modules.js - RUN THIS ONCE TO FIX ALL MODULES
const fs = require('fs');
const path = require('path');

const modulesToFix = [
  'public/modules/fibOverlay.js',
  'public/modules/goalTracker.js', 
  'public/modules/leaderboardUploader.js',
  'public/modules/supportResistance.js',
  'public/modules/trendLines.js',
  'public/modules/sparkleEffects.js',
  'public/modules/stochasticOverlay.js'
];

console.log('🔧 FIXING VALHALLA MODULES...\n');

modulesToFix.forEach(modulePath => {
  try {
    let content = fs.readFileSync(modulePath, 'utf8');
    
    // Replace ES6 exports with window assignments
    content = content.replace(/export\s+function\s+(\w+)/g, 'window.$1 = function');
    content = content.replace(/export\s+const\s+(\w+)/g, 'window.$1');
    content = content.replace(/export\s+{[^}]+}/g, '');
    
    fs.writeFileSync(modulePath, content, 'utf8');
    console.log(`✅ Fixed: ${modulePath}`);
  } catch (err) {
    console.log(`❌ Error fixing ${modulePath}:`, err.message);
  }
});

console.log('\n🚀 MODULE FIX COMPLETE!');