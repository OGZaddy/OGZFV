#!/usr/bin/env node
const fs = require('fs');

const file = '/root/OGZFV-valhalla/run-trading-bot-v13-simplified.js';
let content = fs.readFileSync(file, 'utf8');

// Remove ALL emojis first
content = content.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '');

// Then clean up the messages
content = content.replace(/console\.log\('\s*FILE LOADED:/g, "console.log('[SYSTEM] File loaded:");
content = content.replace(/console\.log\('\s*LOADED /g, "console.log('[MODULE] Loaded ");
content = content.replace(/console\.log\('\s*CONSTRUCTOR START/g, "console.log('[INIT] Constructor");
content = content.replace(/console\.log\('\\n\s*OGZ PRIME.*'\)/g, "console.log('[SYSTEM] OGZ Prime V14 Quantum Trading Engine - Starting')");

// Clean up any double spaces left by emoji removal
content = content.replace(/\s\s+/g, ' ');

fs.writeFileSync(file, content);
console.log('Full cleanup completed');
