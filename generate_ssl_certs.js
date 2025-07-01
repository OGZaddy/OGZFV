#!/usr/bin/env node

/**
 * SSL Certificate Generator for OGZ Prime
 * 
 * This script generates self-signed SSL certificates for development use.
 * For production, use proper SSL certificates from a trusted CA.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const sslDir = path.join(__dirname, 'ssl');

console.log('🔒 OGZ Prime SSL Certificate Generator');
console.log('=====================================');

// Create ssl directory if it doesn't exist
if (!fs.existsSync(sslDir)) {
  fs.mkdirSync(sslDir);
  console.log('📁 Created ssl directory');
}

const keyPath = path.join(sslDir, 'key.pem');
const certPath = path.join(sslDir, 'cert.pem');

// Check if certificates already exist
if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
  console.log('✅ SSL certificates already exist:');
  console.log(`   Key: ${keyPath}`);
  console.log(`   Cert: ${certPath}`);
  console.log('🔄 Delete these files if you want to regenerate them');
  process.exit(0);
}

try {
  console.log('🔧 Generating self-signed SSL certificate...');
  
  // Generate private key and certificate in one command
  const opensslCmd = `openssl req -x509 -newkey rsa:4096 -keyout "${keyPath}" -out "${certPath}" -days 365 -nodes -subj "/C=US/ST=State/L=City/O=OGZPrime/OU=Development/CN=localhost"`;
  
  execSync(opensslCmd, { stdio: 'inherit' });
  
  console.log('✅ SSL certificates generated successfully!');
  console.log(`   Key: ${keyPath}`);
  console.log(`   Cert: ${certPath}`);
  console.log('');
  console.log('🔒 These certificates are for DEVELOPMENT ONLY');
  console.log('⚠️  Browsers will show security warnings for self-signed certificates');
  console.log('💡 For production, use certificates from a trusted Certificate Authority');
  console.log('');
  console.log('🚀 You can now run: node ogzprime_ssl_server.js');
  
} catch (error) {
  console.error('❌ Failed to generate SSL certificates');
  console.error('Error:', error.message);
  console.log('');
  console.log('💡 Alternative methods:');
  console.log('1. Install OpenSSL: https://www.openssl.org/');
  console.log('2. Use mkcert for local development:');
  console.log('   npm install -g mkcert');
  console.log('   mkcert -install');
  console.log('   mkcert localhost 127.0.0.1 ::1');
  console.log('   mv localhost+2.pem ssl/cert.pem');
  console.log('   mv localhost+2-key.pem ssl/key.pem');
  console.log('');
  console.log('3. Manual OpenSSL command:');
  console.log('   openssl req -x509 -newkey rsa:4096 -keyout ssl/key.pem -out ssl/cert.pem -days 365 -nodes -subj "/C=US/ST=State/L=City/O=OGZPrime/OU=Development/CN=localhost"');
}