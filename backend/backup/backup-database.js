/**
 * Database Backup Script
 * This will extract your complete database schema and data
 * Run this with: node backup-database.js
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Database configuration
const dbConfig = {
  host: 'localhost',
  port: 5432,
  database: 'salescare_db',  // Change this to your database name
  user: 'postgres',           // Change this to your username
  password: 'Shamii*05'   // Change this to your password
};

async function backupDatabase() {
  const client = new Client(dbConfig);
  
  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Create backup directory
    const backupDir = path.join(__dirname, 'database-backup');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir);
    }

    // 1. Get all table names
    console.log('\n📋 Fetching table list...');
    const tablesResult = await client.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename
    `);
    
    const tables = tablesResult.rows.map(row => row.tablename);
    console.log(`Found ${tables.length} tables:`, tables.join(', '));

    // 2. Extract complete schema (DDL)
    console.log('\n🔨 Extracting schema...');
    const schemaResult = await client.query(`
      SELECT 
        'CREATE TABLE ' || tablename || E'\n(\n' ||
        array_to_string(
          array_agg(
            '    ' || column_name || ' ' || data_type ||
            CASE 
              WHEN character_maximum_length IS NOT NULL 
              THEN '(' || character_maximum_length || ')' 
              ELSE '' 
            END ||
            CASE WHEN is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END
          ),
          E',\n'
        ) || E'\n);\n' as create_statement
      FROM information_schema.columns
      WHERE table_schema = 'public'
      GROUP BY tablename
      ORDER BY tablename
    `);

    let completeSchema = `-- SALESCARE DATABASE BACKUP
-- Generated on: ${new Date().toISOString()}
-- Database: ${dbConfig.database}

-- ============================================
-- DROP EXISTING TABLES (if needed)
-- ============================================
`;

    // Add DROP statements
    tables.forEach(table => {
      completeSchema += `DROP TABLE IF EXISTS ${table} CASCADE;\n`;
    });

    completeSchema += '\n-- ============================================\n';
    completeSchema += '-- CREATE TABLES\n';
    completeSchema += '-- ============================================\n\n';

    // 3. Get detailed schema including constraints, indexes, triggers
    for (let table of tables) {
      console.log(`  Processing ${table}...`);
      
      // Get full table definition
      const tableDefResult = await client.query(`
        SELECT 
          'CREATE TABLE ' || $1 || ' (' || E'\n' ||
          string_agg(
            '    ' || column_name || ' ' || 
            CASE 
              WHEN data_type = 'character varying' THEN 'VARCHAR(' || character_maximum_length || ')'
              WHEN data_type = 'numeric' THEN 'DECIMAL(' || numeric_precision || ',' || numeric_scale || ')'
              WHEN data_type = 'integer' THEN 'INTEGER'
              WHEN data_type = 'timestamp without time zone' THEN 'TIMESTAMP'
              WHEN data_type = 'boolean' THEN 'BOOLEAN'
              WHEN data_type = 'text' THEN 'TEXT'
              WHEN data_type = 'date' THEN 'DATE'
              ELSE UPPER(data_type)
            END ||
            CASE WHEN column_default IS NOT NULL THEN ' DEFAULT ' || column_default ELSE '' END ||
            CASE WHEN is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END,
            ',' || E'\n'
          ) || E'\n);' as ddl
        FROM information_schema.columns
        WHERE table_name = $1 AND table_schema = 'public'
        ORDER BY ordinal_position
      `, [table]);

      if (tableDefResult.rows.length > 0) {
        completeSchema += tableDefResult.rows[0].ddl + '\n\n';
      }
    }

    // 4. Get primary keys
    completeSchema += '-- ============================================\n';
    completeSchema += '-- PRIMARY KEYS\n';
    completeSchema += '-- ============================================\n\n';

    const pkResult = await client.query(`
      SELECT 
        'ALTER TABLE ' || tc.table_name || 
        ' ADD CONSTRAINT ' || tc.constraint_name || 
        ' PRIMARY KEY (' || string_agg(kcu.column_name, ', ') || ');' as pk_statement
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
      WHERE tc.constraint_type = 'PRIMARY KEY' 
        AND tc.table_schema = 'public'
      GROUP BY tc.table_name, tc.constraint_name
      ORDER BY tc.table_name
    `);

    pkResult.rows.forEach(row => {
      completeSchema += row.pk_statement + '\n';
    });

    // 5. Get foreign keys
    completeSchema += '\n-- ============================================\n';
    completeSchema += '-- FOREIGN KEYS\n';
    completeSchema += '-- ============================================\n\n';

    const fkResult = await client.query(`
      SELECT 
        'ALTER TABLE ' || tc.table_name || 
        ' ADD CONSTRAINT ' || tc.constraint_name || 
        ' FOREIGN KEY (' || kcu.column_name || ')' ||
        ' REFERENCES ' || ccu.table_name || '(' || ccu.column_name || ')' ||
        CASE 
          WHEN rc.delete_rule = 'CASCADE' THEN ' ON DELETE CASCADE'
          WHEN rc.delete_rule = 'SET NULL' THEN ' ON DELETE SET NULL'
          ELSE ''
        END || ';' as fk_statement
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage ccu 
        ON ccu.constraint_name = tc.constraint_name
      JOIN information_schema.referential_constraints rc
        ON tc.constraint_name = rc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND tc.table_schema = 'public'
      ORDER BY tc.table_name
    `);

    fkResult.rows.forEach(row => {
      completeSchema += row.fk_statement + '\n';
    });

    // 6. Get unique constraints
    completeSchema += '\n-- ============================================\n';
    completeSchema += '-- UNIQUE CONSTRAINTS\n';
    completeSchema += '-- ============================================\n\n';

    const uniqueResult = await client.query(`
      SELECT 
        'ALTER TABLE ' || tc.table_name || 
        ' ADD CONSTRAINT ' || tc.constraint_name || 
        ' UNIQUE (' || string_agg(kcu.column_name, ', ') || ');' as unique_statement
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
      WHERE tc.constraint_type = 'UNIQUE' 
        AND tc.table_schema = 'public'
      GROUP BY tc.table_name, tc.constraint_name
      ORDER BY tc.table_name
    `);

    uniqueResult.rows.forEach(row => {
      completeSchema += row.unique_statement + '\n';
    });

    // 7. Get check constraints
    completeSchema += '\n-- ============================================\n';
    completeSchema += '-- CHECK CONSTRAINTS\n';
    completeSchema += '-- ============================================\n\n';

    const checkResult = await client.query(`
      SELECT 
        'ALTER TABLE ' || tc.table_name || 
        ' ADD CONSTRAINT ' || tc.constraint_name || 
        ' CHECK ' || cc.check_clause || ';' as check_statement
      FROM information_schema.table_constraints tc
      JOIN information_schema.check_constraints cc
        ON tc.constraint_name = cc.constraint_name
      WHERE tc.constraint_type = 'CHECK' 
        AND tc.table_schema = 'public'
      ORDER BY tc.table_name
    `);

    checkResult.rows.forEach(row => {
      completeSchema += row.check_statement + '\n';
    });

    // 8. Get indexes
    completeSchema += '\n-- ============================================\n';
    completeSchema += '-- INDEXES\n';
    completeSchema += '-- ============================================\n\n';

    const indexResult = await client.query(`
      SELECT indexdef || ';' as index_statement
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND indexname NOT LIKE '%_pkey'
      ORDER BY tablename, indexname
    `);

    indexResult.rows.forEach(row => {
      completeSchema += row.index_statement + '\n';
    });

    // 9. Get sequences
    completeSchema += '\n-- ============================================\n';
    completeSchema += '-- SEQUENCES\n';
    completeSchema += '-- ============================================\n\n';

    const seqResult = await client.query(`
      SELECT 
        'CREATE SEQUENCE IF NOT EXISTS ' || sequencename || ';' as seq_statement,
        sequencename
      FROM pg_sequences
      WHERE schemaname = 'public'
      ORDER BY sequencename
    `);

    seqResult.rows.forEach(row => {
      completeSchema += row.seq_statement + '\n';
    });

    // 10. Get triggers and functions
    completeSchema += '\n-- ============================================\n';
    completeSchema += '-- FUNCTIONS\n';
    completeSchema += '-- ============================================\n\n';

    const funcResult = await client.query(`
      SELECT pg_get_functiondef(oid) || ';' as func_def
      FROM pg_proc
      WHERE pronamespace = 'public'::regnamespace
      ORDER BY proname
    `);

    funcResult.rows.forEach(row => {
      completeSchema += row.func_def + '\n\n';
    });

    completeSchema += '-- ============================================\n';
    completeSchema += '-- TRIGGERS\n';
    completeSchema += '-- ============================================\n\n';

    const triggerResult = await client.query(`
      SELECT 
        'CREATE TRIGGER ' || trigger_name || 
        ' ' || action_timing || ' ' || event_manipulation ||
        ' ON ' || event_object_table ||
        ' FOR EACH ' || action_orientation ||
        ' EXECUTE FUNCTION ' || action_statement || ';' as trigger_def
      FROM information_schema.triggers
      WHERE trigger_schema = 'public'
      ORDER BY event_object_table, trigger_name
    `);

    triggerResult.rows.forEach(row => {
      completeSchema += row.trigger_def + '\n';
    });

    // Save complete schema
    const schemaFile = path.join(backupDir, 'complete_schema.sql');
    fs.writeFileSync(schemaFile, completeSchema);
    console.log(`\n✅ Schema saved to: ${schemaFile}`);

    // 11. Export data for each table
    console.log('\n📦 Exporting data...');
    let dataScript = `-- DATA BACKUP
-- Generated on: ${new Date().toISOString()}

`;

    for (let table of tables) {
      const countResult = await client.query(`SELECT COUNT(*) FROM ${table}`);
      const count = parseInt(countResult.rows[0].count);
      
      if (count > 0) {
        console.log(`  Exporting ${count} rows from ${table}...`);
        
        const dataResult = await client.query(`SELECT * FROM ${table}`);
        
        if (dataResult.rows.length > 0) {
          const columns = Object.keys(dataResult.rows[0]);
          
          dataScript += `\n-- Data for ${table} (${count} rows)\n`;
          
          dataResult.rows.forEach(row => {
            const values = columns.map(col => {
              const val = row[col];
              if (val === null) return 'NULL';
              if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
              if (val instanceof Date) return `'${val.toISOString()}'`;
              if (typeof val === 'boolean') return val ? 'true' : 'false';
              return val;
            });
            
            dataScript += `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${values.join(', ')});\n`;
          });
        }
      } else {
        console.log(`  ${table} is empty, skipping...`);
      }
    }

    const dataFile = path.join(backupDir, 'data_backup.sql');
    fs.writeFileSync(dataFile, dataScript);
    console.log(`\n✅ Data saved to: ${dataFile}`);

    // 12. Create a combined file
    const combinedFile = path.join(backupDir, 'FULL_BACKUP.sql');
    const combined = completeSchema + '\n\n' + dataScript;
    fs.writeFileSync(combinedFile, combined);
    console.log(`✅ Complete backup saved to: ${combinedFile}`);

    // 13. Create restore script
    const restoreScript = `#!/bin/bash
# Database Restore Script
# Run this to restore your database on a new machine

# Configuration
DB_NAME="salescare_db"
DB_USER="postgres"
DB_HOST="localhost"
DB_PORT="5432"

echo "🔄 Restoring SalesCare Database..."

# Create database if it doesn't exist
psql -U $DB_USER -h $DB_HOST -p $DB_PORT -tc "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" | grep -q 1 || psql -U $DB_USER -h $DB_HOST -p $DB_PORT -c "CREATE DATABASE $DB_NAME"

# Restore schema and data
psql -U $DB_USER -h $DB_HOST -p $DB_PORT -d $DB_NAME -f complete_schema.sql
psql -U $DB_USER -h $DB_HOST -p $DB_PORT -d $DB_NAME -f data_backup.sql

echo "✅ Database restored successfully!"
`;

    fs.writeFileSync(path.join(backupDir, 'restore.sh'), restoreScript);
    fs.chmodSync(path.join(backupDir, 'restore.sh'), '755');

    console.log('\n✅ Restore script created: restore.sh');

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📁 BACKUP COMPLETE!');
    console.log('='.repeat(50));
    console.log(`\nFiles created in: ${backupDir}`);
    console.log('  1. complete_schema.sql  - Full database structure');
    console.log('  2. data_backup.sql      - All your data');
    console.log('  3. FULL_BACKUP.sql      - Combined schema + data');
    console.log('  4. restore.sh           - Restore script');
    console.log('\n💡 To restore on another laptop:');
    console.log('  1. Copy the database-backup folder');
    console.log('  2. Run: psql -U postgres -f FULL_BACKUP.sql');
    console.log('  OR');
    console.log('  3. Run: ./restore.sh (on Linux/Mac)');
    console.log('='.repeat(50) + '\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await client.end();
  }
}

// Run the backup
backupDatabase();