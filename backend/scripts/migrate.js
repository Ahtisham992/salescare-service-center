// backend/scripts/migrate.js
const fs = require('fs');
const path = require('path');
const { pool } = require('../config/database');

const runMigration = async () => {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Starting database migration...\n');

    // Read the SQL schema file
    const schemaPath = path.join(__dirname, '../migrations/initial_schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    console.log('📝 Executing schema...\n');

    // Execute the entire schema as one transaction
    await client.query('BEGIN');
    
    try {
      // Execute the entire SQL file at once
      await client.query(schemaSql);
      await client.query('COMMIT');
      
      console.log('✅ All tables and structures created successfully!');
    } catch (err) {
      await client.query('ROLLBACK');
      
      // If error is "already exists", that's okay
      if (err.code === '42P07' || err.code === '42710') {
        console.log('⚠️  Some objects already exist, continuing...');
      } else {
        throw err;
      }
    }

    console.log('\n✅ Migration completed successfully!');
    
    // Display table count
    const result = await client.query(`
      SELECT COUNT(*) as table_count 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log(`📊 Total tables in database: ${result.rows[0].table_count}`);

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
};

// Run migration
if (require.main === module) {
  runMigration()
    .then(() => {
      console.log('\n🎉 Database is ready!');
      process.exit(0);
    })
    .catch((err) => {
      console.error('\n💥 Migration error:', err);
      process.exit(1);
    });
}

module.exports = runMigration;