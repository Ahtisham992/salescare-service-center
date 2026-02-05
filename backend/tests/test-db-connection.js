// test-db-connection.js
// Run this to test your Supabase connection
require('dotenv').config();
const { Pool } = require('pg');

console.log('🔍 Testing Database Connection...\n');

// Show what we're trying to connect to (hide password)
const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error('❌ DATABASE_URL is not set in .env file!');
  process.exit(1);
}

// Parse and display connection details (without password)
const urlParts = dbUrl.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
if (urlParts) {
  console.log('Connection Details:');
  console.log('  User:', urlParts[1]);
  console.log('  Password:', '***' + urlParts[2].slice(-4));
  console.log('  Host:', urlParts[3]);
  console.log('  Port:', urlParts[4]);
  console.log('  Database:', urlParts[5]);
  console.log('');
}

// Try different connection string formats
const connectionConfigs = [
  {
    name: 'Direct Connection (Transaction Mode)',
    connectionString: `postgresql://postgres.ovxxgtykcahwacgyyjxc:im76kb2pISlD7B66@aws-0-ap-south-1.pooler.supabase.com:6543/postgres`,
    ssl: { rejectUnauthorized: false }
  },
  {
    name: 'Direct Connection (Session Mode)',
    connectionString: `postgresql://postgres.ovxxgtykcahwacgyyjxc:im76kb2pISlD7B66@aws-0-ap-south-1.pooler.supabase.com:5432/postgres`,
    ssl: { rejectUnauthorized: false }
  },
  {
    name: 'Connection String from ENV',
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  }
];

async function testConnection(config) {
  console.log(`\n🔄 Testing: ${config.name}`);
  console.log(`   URL: ${config.connectionString.replace(/:[^:@]+@/, ':****@')}`);
  
  const pool = new Pool(config);
  
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW(), current_database(), current_user');
    
    console.log('✅ SUCCESS!');
    console.log('   Time:', result.rows[0].now);
    console.log('   Database:', result.rows[0].current_database);
    console.log('   User:', result.rows[0].current_user);
    
    client.release();
    await pool.end();
    return true;
  } catch (error) {
    console.error('❌ FAILED!');
    console.error('   Error:', error.message);
    
    // Additional debugging
    if (error.code) console.error('   Code:', error.code);
    if (error.errno) console.error('   Errno:', error.errno);
    
    await pool.end();
    return false;
  }
}

async function runTests() {
  console.log('=' .repeat(60));
  
  let successCount = 0;
  for (const config of connectionConfigs) {
    const success = await testConnection(config);
    if (success) successCount++;
  }
  
  console.log('\n' + '='.repeat(60));
  console.log(`\n📊 Results: ${successCount}/${connectionConfigs.length} connections successful\n`);
  
  if (successCount === 0) {
    console.log('⚠️  TROUBLESHOOTING STEPS:');
    console.log('   1. Check if your Supabase project is active (not paused)');
    console.log('   2. Verify the password in your connection string');
    console.log('   3. Go to Supabase Dashboard → Settings → Database');
    console.log('   4. Copy the "Connection string" (URI mode)');
    console.log('   5. Make sure you replaced [YOUR-PASSWORD] with actual password');
    console.log('   6. Check your internet connection');
    console.log('   7. Try disabling VPN/firewall temporarily');
  }
}

runTests();