console.log('[OGZP] Core Mind Activated - Mode: Sassy');
const consoleBox = document.getElementById('ogzp-console') || document.body;
function ogzpSay(msg) {
  const div = document.createElement('div');
  div.className = 'ogzp-message';
  div.textContent = `[OGZP] ${msg}`;
  consoleBox.appendChild(div);
}
ogzpSay('Analyzing trade memory... Pattern match detected.');
ogzpSay('Confidence above threshold. Position: Long.');
ogzpSay('Risk allocation acceptable. Proceeding.');
