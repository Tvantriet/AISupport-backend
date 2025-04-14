import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import path from 'path';
import pg from 'pg';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

async function addImageColumn() {
  console.log('Adding image column to products table...');
  
  const client = new pg.Client({
    connectionString: process.env.DATABASE_URL,
  });
  
  try {
    await client.connect();
    console.log('Connected to database');
    
    const sql = `
      ALTER TABLE products 
      ADD COLUMN IF NOT EXISTS image BYTEA;
    `;
    
    console.log('Executing SQL...');
    await client.query(sql);
    console.log('Image column added successfully');
    
  } catch (error) {
    console.error('Failed to add image column:', error);
  } finally {
    await client.end();
    console.log('Database connection closed');
  }
}

addImageColumn().catch(console.error); 