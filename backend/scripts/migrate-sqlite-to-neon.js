#!/usr/bin/env node
/**
 * Neon PostgreSQL Migration Script
 * Migrates data from SQLite (Strapi v5 default) to Neon PostgreSQL
 * Run this AFTER deploying to Neon and running strapi db:push
 */

const { createClient } = require('@neondatabase/serverless');
const { drizzle } = require('drizzle-orm/neon-serverless');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.production' });

const NEON_DATABASE_URL = process.env.DATABASE_URL;

if (!NEON_DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in .env.production');
  process.exit(1);
}

const sql = createClient({ connectionString: NEON_DATABASE_URL });
const db = drizzle(sql);

async function migrateSQLiteToNeon() {
  console.log('🚀 Starting SQLite → Neon PostgreSQL migration...\n');
  
  const sqlitePath = path.join(__dirname, '..', '..', '.tmp', 'data.db');
  
  if (!fs.existsSync(sqlitePath)) {
    console.error(`❌ SQLite database not found at: ${sqlitePath}`);
    console.log('💡 Run `npm run strapi develop` first to generate the SQLite database');
    process.exit(1);
  }

  const Database = require('better-sqlite3');
  const sqlite = new Database(sqlitePath, { readonly: true });
  
  try {
    // Get all tables from SQLite
    const tables = sqlite.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_%'
    `).all();
    
    console.log(`📋 Found ${tables.length} tables to migrate\n`);
    
    for (const table of tables) {
      const tableName = table.name;
      console.log(`📦 Migrating table: ${tableName}...`);
      
      // Get table data
      const rows = sqlite.prepare(`SELECT * FROM "${tableName}"`).all();
      
      if (rows.length === 0) {
        console.log(`   ⚠️  Table ${tableName} is empty, skipping...`);
        continue;
      }
      
      // Get column names
      const columns = Object.keys(rows[0]);
      const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
      const columnNames = columns.map(c => `"${c}"`).join(', ');
      
      // Insert in batches
      const batchSize = 100;
      for (let i = 0; i < rows.length; i += batchSize) {
        const batch = rows.slice(i, i + batchSize);
        const values = batch.map(row => columns.map(c => row[c]));
        
        const query = `
          INSERT INTO "${tableName}" (${columnNames})
          VALUES ${values.map((_, i) => `(${placeholders})`).join(', ')}
          ON CONFLICT DO NOTHING
        `;
        
        await sql.query(query, values.flat());
      }
      
      console.log(`   ✅ Migrated ${rows.length} rows`);
    }
    
    console.log('\n✅ Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    sqlite.close();
    await sql.end();
  }
}

migrateSQLiteToNeon();