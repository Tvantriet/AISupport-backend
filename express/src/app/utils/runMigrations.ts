import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import PostgresService from '../services/DatabaseService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigrations() {
  const db = new PostgresService();
  await db.connect();
  
  try {
    // Create migrations table if it doesn't exist
    await db.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Get all migration files
    const migrationsDir = path.join(__dirname, '../../migrations');
    const files = await fs.readdir(migrationsDir);
    const sqlFiles = files.filter(file => file.endsWith('.sql')).sort();
    
    // Check which migrations have been run
    const executedMigrations = await db.query('SELECT name FROM migrations');
    const executedMigrationNames = executedMigrations.map(m => m.name);
    
    // Run migrations that haven't been executed yet
    for (const file of sqlFiles) {
      if (!executedMigrationNames.includes(file)) {
        console.log(`Running migration: ${file}`);
        
        // Read and execute the SQL file
        const filePath = path.join(migrationsDir, file);
        const sql = await fs.readFile(filePath, 'utf8');
        
        // Execute the migration in a transaction
        await db.query('BEGIN');
        try {
          await db.query(sql);
          await db.query('INSERT INTO migrations (name) VALUES ($1)', [file]);
          await db.query('COMMIT');
          console.log(`Migration ${file} completed successfully`);
        } catch (error) {
          await db.query('ROLLBACK');
          console.error(`Migration ${file} failed:`, error);
          throw error;
        }
      } else {
        console.log(`Migration ${file} already executed, skipping`);
      }
    }
    
    console.log('All migrations completed');
  } finally {
    await db.disconnect();
  }
}

// Run migrations if this file is executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runMigrations().catch(console.error);
}

export default runMigrations; 