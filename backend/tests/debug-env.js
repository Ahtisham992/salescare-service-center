// backend/tests/debug-env.js
// Run this to check if .env is loaded correctly
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

console.log('\n========================================');
console.log('ENVIRONMENT VARIABLES DEBUG');
console.log('========================================\n');

console.log('✓ dotenv loaded from:', require('path').resolve('.env'));
console.log('\nNotification Settings:');
console.log('- EMAIL_ENABLED:', process.env.DATABASE_URL);
console.log('- EMAIL_USER:', process.env.EMAIL_USER);
console.log('- EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? '***' + process.env.EMAIL_PASSWORD.slice(-4) : 'NOT SET');
console.log('- SMS_ENABLED:', process.env.SMS_ENABLED);
console.log('- COMPANY_NAME:', process.env.COMPANY_NAME);

console.log('\nChecks:');
console.log('- EMAIL_ENABLED === "true":', process.env.EMAIL_ENABLED === 'true');
console.log('- EMAIL_USER is set:', !!process.env.EMAIL_USER);
console.log('- EMAIL_PASSWORD is set:', !!process.env.EMAIL_PASSWORD);

console.log('\n========================================');
console.log('If EMAIL_ENABLED shows "false", check your .env file!');
console.log('Make sure it\'s in backend/.env (same folder as package.json)');
console.log('========================================\n');