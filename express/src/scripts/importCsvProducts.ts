import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { parse } from 'csv-parse/sync';
import fetch from 'node-fetch';
import ProductService from '../app/services/ProductService.js';
import ProductRepository from '../app/repositories/ProductRepository.js';
import R2FileStorage from '../app/services/R2FileStorage.js';
import PostgresService from '../app/services/PostgresService.js';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

interface CsvProduct {
  category: string;
  name: string;
  description: string;
  image_url: string;
  product_url: string;
}

async function downloadImage(url: string): Promise<Buffer> {
  console.log(`Downloading image: ${url}`);
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.status} ${response.statusText}`);
    }
    
    return Buffer.from(await response.arrayBuffer());
  } catch (error) {
    console.error(`Error downloading image: ${error}`);
    throw error;
  }
}

async function importCsvProducts(csvPath: string) {
  try {
    // Initialize services
    const db = new PostgresService();
    await db.connect();
    const storage = new R2FileStorage();
    const productRepository = new ProductRepository(db);
    const productService = new ProductService(productRepository, storage);
    
    // Read and parse CSV
    const csvContent = fs.readFileSync(csvPath, 'utf8');
    const products = parse(csvContent, {
      columns: true,
      skip_empty_lines: true
    }) as CsvProduct[];
    
    console.log(`Found ${products.length} products in CSV`);
    
    // Import statistics
    let success = 0;
    let failed = 0;
    const errors = [];
    
    // Process each product
    for (const csvProduct of products) {
      try {
        console.log(`Processing ${csvProduct.name}`);
        
        // Download image
        const imageBuffer = await downloadImage(csvProduct.image_url);
        
        // Create product using your existing ProductService
        await productService.createProduct({
          name: csvProduct.name,
          description: csvProduct.description,
          image: imageBuffer
        });
        
        success++;
        console.log(`Imported: ${csvProduct.name}`);
      } catch (error) {
        failed++;
        console.error(`Failed to import ${csvProduct.name}:`, error);
        errors.push({ product: csvProduct.name, error: error });
      }
    }
    
    // Print results
    console.log('Import complete:');
    console.log(`- Successfully imported: ${success}`);
    console.log(`- Failed imports: ${failed}`);
    
    if (errors.length > 0) {
      console.log('Error details:');
      errors.forEach((error, index) => {
        console.log(`${index + 1}. Product: ${error.product}`);
        console.log(`   Error: ${error.error}`);
      });
    }
    
    // Disconnect database
    await db.disconnect();
    
  } catch (error) {
    console.error('Import process failed:', error);
    process.exit(1);
  }
}

// Get CSV path from command line
const csvPath = process.argv[2];
if (!csvPath) {
  console.error('Please provide the path to the CSV file');
  console.error('Usage: npx ts-node src/scripts/importCsvProducts.ts path/to/products.csv');
  process.exit(1);
}

// Run the import
importCsvProducts(csvPath).catch(console.error); 