// fix-admin-password.js
// Run this in your backend folder: node fix-admin-password.js

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function fixAdminPassword() {
  console.log('🔧 Fixing admin user password...\n');

  try {
    // Generate new hash for "admin123"
    const password = 'admin123';
    const hash = await bcrypt.hash(password, 10);
    
    console.log('Generated new password hash:');
    console.log('Password:', password);
    console.log('Hash:', hash);
    console.log('');

    // Check if admin user exists
    const checkResult = await pool.query(
      'SELECT user_id, username, password_hash FROM users WHERE username = $1',
      ['admin']
    );

    if (checkResult.rows.length === 0) {
      console.log('❌ Admin user not found. Creating new admin user...\n');
      
      // Create new admin user
      await pool.query(
        `INSERT INTO users (username, password_hash, full_name, role, email, is_active) 
         VALUES ($1, $2, $3, $4, $5, $6)`,
        ['admin', hash, 'System Administrator', 'admin', 'admin@salescare.com', true]
      );
      
      console.log('✅ Admin user created successfully!');
    } else {
      console.log('✅ Admin user found. Updating password...\n');
      console.log('Current hash:', checkResult.rows[0].password_hash);
      console.log('New hash:    ', hash);
      console.log('');
      
      // Update password
      await pool.query(
        'UPDATE users SET password_hash = $1 WHERE username = $2',
        [hash, 'admin']
      );
      
      console.log('✅ Password updated successfully!');
    }

    // Verify it works
    const verifyResult = await pool.query(
      'SELECT user_id, username, password_hash, full_name, role FROM users WHERE username = $1',
      ['admin']
    );

    if (verifyResult.rows.length > 0) {
      const user = verifyResult.rows[0];
      const isValid = await bcrypt.compare(password, user.password_hash);
      
      console.log('\n📋 Verification:');
      console.log('User ID:', user.user_id);
      console.log('Username:', user.username);
      console.log('Full Name:', user.full_name);
      console.log('Role:', user.role);
      console.log('Password Test:', isValid ? '✅ PASS' : '❌ FAIL');
      
      if (isValid) {
        console.log('\n🎉 Success! You can now login with:');
        console.log('   Username: admin');
        console.log('   Password: admin123');
      } else {
        console.log('\n❌ Password verification failed. Please check bcrypt configuration.');
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
}

fixAdminPassword();