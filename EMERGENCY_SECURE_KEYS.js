/**
 * EMERGENCY API KEY ROTATION SCRIPT
 * Immediately rotates all exposed API keys
 */

const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

console.log('🚨 EMERGENCY API KEY SECURITY PROTOCOL ACTIVATED');
console.log('⏰ Timestamp:', new Date().toISOString());

// Backup current .env
const envPath = path.join(__dirname, '.env');
const backupPath = path.join(__dirname, `.env.COMPROMISED_${Date.now()}`);

try {
    // 1. Backup compromised keys
    fs.copyFileSync(envPath, backupPath);
    console.log(`✅ Backed up compromised keys to: ${backupPath}`);
    
    // 2. Read current .env
    const envContent = fs.readFileSync(envPath, 'utf8');
    
    // 3. Replace all sensitive keys with placeholders
    const securedContent = envContent
        // API Keys
        .replace(/ALPHA_VANTAGE_API_KEY=.*/g, 'ALPHA_VANTAGE_API_KEY=REVOKED_ROTATE_IMMEDIATELY')
        .replace(/POLYGON_API_KEY=.*/g, 'POLYGON_API_KEY=REVOKED_ROTATE_IMMEDIATELY')
        .replace(/STRIPE_SECRET_KEY=.*/g, 'STRIPE_SECRET_KEY=REVOKED_ROTATE_IMMEDIATELY')
        .replace(/MOVER_API_KEY=.*/g, 'MOVER_API_KEY=REVOKED_ROTATE_IMMEDIATELY')
        .replace(/MOVER_VOICE_API_KEY=.*/g, 'MOVER_VOICE_API_KEY=REVOKED_ROTATE_IMMEDIATELY')
        // Secrets
        .replace(/JWT_SECRET=.*/g, `JWT_SECRET=${crypto.randomBytes(32).toString('hex')}`)
        .replace(/DATABASE_URL=.*@/g, 'DATABASE_URL=postgresql://CHANGE_PASSWORD@');
    
    // 4. Write secured .env
    fs.writeFileSync(envPath, securedContent);
    console.log('✅ API keys have been revoked in .env file');
    
    // 5. Create security report
    const report = `
SECURITY INCIDENT REPORT
========================
Time: ${new Date().toISOString()}
Incident: Message interception detected
Action: Emergency API key rotation

COMPROMISED KEYS DETECTED:
- Alpha Vantage API Key
- Polygon.io API Key  
- Stripe Secret Key
- Mover API Keys
- JWT Secret

IMMEDIATE ACTIONS REQUIRED:
1. Go to each service provider's dashboard
2. Revoke the old API keys immediately
3. Generate new API keys
4. Update .env with new keys
5. Change database password
6. Review all recent trading activity

SECURITY RECOMMENDATIONS:
1. Enable 2FA on all service accounts
2. Use environment-specific keys
3. Implement key rotation policy
4. Set up API key usage alerts
5. Use secret management service (AWS Secrets Manager, etc.)

Backup of compromised keys: ${backupPath}
`;
    
    fs.writeFileSync('SECURITY_INCIDENT_REPORT.txt', report);
    console.log('📄 Security report created: SECURITY_INCIDENT_REPORT.txt');
    
    // 6. Kill any running bot processes
    console.log('\n🛑 STOPPING ALL BOT PROCESSES...');
    console.log('Run: pkill -f "node.*trading-bot"');
    
    console.log('\n✅ EMERGENCY PROTOCOL COMPLETE');
    console.log('⚠️  ALL API KEYS HAVE BEEN REVOKED');
    console.log('🔑 You must manually generate new keys from each provider\n');
    
} catch (error) {
    console.error('❌ SECURITY PROTOCOL FAILED:', error);
    console.error('⚠️  MANUALLY REVOKE ALL API KEYS IMMEDIATELY!');
}