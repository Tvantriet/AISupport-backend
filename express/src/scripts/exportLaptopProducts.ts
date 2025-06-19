import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import path from 'path';
import pg from 'pg';
import fs from 'fs';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

async function exportLaptopProducts() {
  console.log('Exporting laptop products...');
  
  const client = new pg.Client({
    connectionString: process.env.DATABASE_URL,
    // Alternatively, use explicit connection parameters:
    // host: 'localhost',
    // port: 5432,
    // database: 'your_database_name',
    // user: 'your_username',
    // password: 'your_password',
  });
  
  try {
    await client.connect();
    console.log('Connected to database');

    // Query laptop products
    // This query joins products with categories through the product_categories linking table
    const result = await client.query(`
      SELECT p.name as product_name
      FROM products p
      JOIN product_categories pc ON p.id = pc.product_id
      JOIN categories c ON pc.category_id = c.id
      WHERE c.name = 'Laptop'
    `);

    // Format the data for JSON
    const laptopProducts = result.rows.map(row => row.product_name);

    // Write to JSON file
    const outputPath = 'C:/users/timvt/downloads/laptop_names.json';
    fs.writeFileSync(outputPath, JSON.stringify(laptopProducts, null, 2));

    console.log(`Exported ${laptopProducts.length} laptop products to ${outputPath}`);
    
  } catch (error) {
    console.error('Failed to export laptop products:', error);
    throw error;
  } finally {
    await client.end();
    console.log('Database connection closed');
  }
}

// Run the script
exportLaptopProducts().catch(console.error); 