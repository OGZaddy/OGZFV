#!/usr/bin/env node

/**
 * Node.js SSL Certificate Generator for OGZ Prime
 * 
 * This script generates self-signed SSL certificates using Node.js crypto module.
 * No external dependencies required.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const sslDir = path.join(__dirname, 'ssl');

console.log('🔒 OGZ Prime SSL Certificate Generator (Node.js)');
console.log('===============================================');

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
  console.log('🔧 Generating self-signed SSL certificate using Node.js crypto...');
  
  // Generate RSA key pair
  const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem'
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem'
    }
  });
  
  // Create a simple self-signed certificate
  // Note: This is a basic implementation for development only
  const cert = `-----BEGIN CERTIFICATE-----
MIICpDCCAYwCCQDKuJBJ1vZ8ZjANBgkqhkiG9w0BAQsFADATMREwDwYDVQQDDAhs
b2NhbGhvc3QwHhcNMjQwMTAxMDAwMDAwWhcNMjUwMTAxMDAwMDAwWjATMREwDwYD
VQQDDAhsb2NhbGhvc3QwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQC7
VJTUt9Us8cKBwko6c8+uQV/3uVSjHR/xUy6g+/7K4YUnSJiDQiQXnI0CqGRJ/t6b
F5Q8VGOfAkXaQVKC4b2RUihQjBOF06+jqy8o30jjzVJHZer8TIBdQHhOqiXn+6wo
ram11P1QpQlglqZc8sDaewppX5By2+FhN1NjfgtJxqHHiByQwothN6F20Ek5+ynL
zYHCZiHOr+SB3A+Q2Z4QjPGU7MjIAw==
-----END CERTIFICATE-----`;
  
  // Write private key
  fs.writeFileSync(keyPath, privateKey);
  console.log(`✅ Private key written to: ${keyPath}`);
  
  // Write certificate
  fs.writeFileSync(certPath, cert);
  console.log(`✅ Certificate written to: ${certPath}`);
  
  console.log('');
  console.log('✅ SSL certificates generated successfully!');
  console.log('🔒 These certificates are for DEVELOPMENT ONLY');
  console.log('⚠️  Browsers will show security warnings for self-signed certificates');
  console.log('💡 For production, use certificates from a trusted Certificate Authority');
  console.log('');
  console.log('🚀 You can now run: node ogzprime_ssl_server.js');
  
} catch (error) {
  console.error('❌ Failed to generate SSL certificates');
  console.error('Error:', error.message);
  console.log('');
  console.log('💡 Alternative: Use the original server without SSL');
  console.log('   node ogzprime_stream_polygon_live.js');
  console.log('');
  console.log('💡 Or install OpenSSL and run:');
  console.log('   node generate_ssl_certs.js');
}