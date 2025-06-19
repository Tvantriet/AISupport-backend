import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import path from 'path';
import pg from 'pg';
import fs from 'fs';
import { parse } from 'csv-parse';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

async function updateProductCategories() {
  console.log('Updating product categories from CSV...');
  
  const client = new pg.Client({
    connectionString: process.env.DATABASE_URL,
  });
  
  try {
    await client.connect();
    console.log('Connected to database');

    // Get category IDs
    const laptopCategory = await client.query('SELECT id FROM categories WHERE name = $1', ['Laptop']);
    const macOSCategory = await client.query('SELECT id FROM categories WHERE name = $1', ['macOS']);
    const windowsOSCategory = await client.query('SELECT id FROM categories WHERE name = $1', ['WindowsOS']);

    const laptopCategoryId = laptopCategory.rows[0]?.id;
    const macOSCategoryId = macOSCategory.rows[0]?.id;
    const windowsOSCategoryId = windowsOSCategory.rows[0]?.id;

    if (!laptopCategoryId || !macOSCategoryId || !windowsOSCategoryId) {
      throw new Error('Required categories not found in database');
    }

    // Read and process CSV file
    const csvData = fs.readFileSync('C:/users/timvt/downloads/products.csv', 'utf-8');
    const parser = parse(csvData, { 
      columns: true,
      skip_empty_lines: true,
      trim: true
    });
    
    let processedCount = 0;
    let successCount = 0;
    let notFoundCount = 0;
    
    for await (const record of parser) {
      processedCount++;
      
      // Find product by name
      const product = await client.query('SELECT id FROM products WHERE name = $1', [record.name]);
      
      if (product.rows.length > 0) {
        const productId = product.rows[0].id;
        
        // Use the correct category field name to handle potential typos
        const categoryField = Object.keys(record).find(key => 
          key === 'category' || key === 'ategory' || key.includes('categ')
        );
        const category = categoryField ? record[categoryField] : undefined;
        
        // Add laptop category if category is Laptops
        if (category === 'Laptops') {
          await client.query(
            'INSERT INTO product_categories (product_id, category_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [productId, laptopCategoryId]
          );
        }

        // Add OS category based on product name
        const osCategory = record.name.toLowerCase().includes('apple') ? macOSCategoryId : windowsOSCategoryId;
        await client.query(
          'INSERT INTO product_categories (product_id, category_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [productId, osCategory]
        );

        console.log(`Updated categories for product: ${record.name}`);
        successCount++;
      } else {
        console.log(`Product not found: ${record.name}`);
        notFoundCount++;
      }
    }

    console.log(`Product categories updated successfully`);
    console.log(`Summary: Processed ${processedCount} products - Success: ${successCount}, Not found: ${notFoundCount}`);
    
  } catch (error) {
    console.error('Failed to update product categories:', error);
    throw error;
  } finally {
    await client.end();
    console.log('Database connection closed');
  }
}

// Run the script
updateProductCategories().catch(console.error); 