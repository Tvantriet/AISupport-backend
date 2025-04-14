import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import path from 'path';
import pg from 'pg';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

async function createProductsTable() {
  console.log('Creating products table directly...');
  
  const client = new pg.Client({
    connectionString: process.env.DATABASE_URL,
  });
  
  try {
    await client.connect();
    console.log('Connected to database');
    
    // SQL to create the products table directly
    const sql = `
      CREATE TABLE IF NOT EXISTS products (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        category VARCHAR(255),
        image_url VARCHAR(255),
        product_url VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    console.log('Executing SQL...');
    await client.query(sql);
    console.log('Products table created successfully');
    
  } catch (error) {
    console.error('Failed to create products table:', error);
  } finally {
    await client.end();
    console.log('Database connection closed');
  }
}

createProductsTable().catch(console.error); 