import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import pg from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { QdrantClient } from '@qdrant/js-client-rest';
import OpenAIEmbeddingService from '../app/services/OpenAIEmbeddingService.js';
// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

const embeddingService = new OpenAIEmbeddingService();

// File path for formatted tickets JSON
const formattedJsonPath = 'C:\\Users\\Timvt\\Downloads\\formatted_tickets.json';

interface CategoryData {
  custom_id: string;
  queries: string[];
}

async function importToQdrant() {
  console.log('Starting import to Qdrant...');
  
  // Read the formatted JSON file
  if (!fs.existsSync(formattedJsonPath)) {
    throw new Error(`Formatted JSON file not found at: ${formattedJsonPath}`);
  }
  
  const formattedTickets: CategoryData[] = JSON.parse(fs.readFileSync(formattedJsonPath, 'utf-8'));
  console.log(`Loaded ${formattedTickets.length} categories from JSON file`);
  
  // Connect to PostgreSQL
  const pgClient = new pg.Client({
    connectionString: process.env.DATABASE_URL,
  });
  
  // Connect to Qdrant
  const qdrantClient = new QdrantClient({
    url: process.env.QDRANT_URL || 'http://localhost:6333',
  });
  
  try {
    await pgClient.connect();
    console.log('Connected to PostgreSQL database');
    
    // Get category IDs
    const laptopCategory = await pgClient.query('SELECT id, name FROM categories WHERE name = $1', ['Laptop']);
    const macOSCategory = await pgClient.query('SELECT id, name FROM categories WHERE name = $1', ['macOS']);
    const windowsOSCategory = await pgClient.query('SELECT id, name FROM categories WHERE name = $1', ['WindowsOS']);
    
    const laptopCategoryId = laptopCategory.rows[0]?.id;
    const macOSCategoryId = macOSCategory.rows[0]?.id;
    const windowsOSCategoryId = windowsOSCategory.rows[0]?.id;
    
    console.log('Category IDs:', {
      laptop: laptopCategoryId,
      macOS: macOSCategoryId,
      windows: windowsOSCategoryId
    });
    
    if (!laptopCategoryId || !macOSCategoryId || !windowsOSCategoryId) {
      throw new Error('Required categories not found in database');
    }
    
    // Get all laptop products
    const laptopProducts = await pgClient.query(`
      SELECT p.id, p.name, p.description, 
        CASE 
          WHEN p.name ILIKE '%apple%' THEN '${macOSCategoryId}'
          ELSE '${windowsOSCategoryId}'
        END as os_category_id
      FROM products p
      JOIN product_categories pc ON p.id = pc.product_id
      JOIN categories c ON pc.category_id = c.id
      WHERE c.name = 'Laptop'
    `);
    
    console.log(`Found ${laptopProducts.rows.length} laptop products`);
    
    // Create a map of category/product names to IDs
    const idMap: Record<string, { id: string, description?: string }> = {
      'Laptop': { id: laptopCategoryId },
      'WindowsOS': { id: windowsOSCategoryId },
      'macOS': { id: macOSCategoryId }
    };
    
    // Add product IDs to the map
    for (const product of laptopProducts.rows) {
      idMap[product.name] = { id: product.id, description: product.description };
    }
    
    // Check existing collections in Qdrant
    const existingCollections = await qdrantClient.getCollections();
    const existingCollectionNames = existingCollections.collections.map(c => c.name);
    
    // Process each category/product in the formatted tickets
    for (const item of formattedTickets) {
      const customId = item.custom_id;
      const queries = item.queries;
      
      if (!idMap[customId]) {
        console.log(`No ID mapping found for: ${customId} - skipping`);
        continue;
      }
      
      const collectionId = idMap[customId].id;
      const description = idMap[customId].description || '';
      const isCategory = customId === 'Laptop' || customId === 'WindowsOS' || customId === 'macOS';
      
      console.log(`Processing ${isCategory ? 'category' : 'product'}: ${customId} (ID: ${collectionId}) with ${queries.length} tickets`);
      
      // Create collection if it doesn't exist
      if (!existingCollectionNames.includes(collectionId)) {
        console.log(`Creating collection ${collectionId} (${customId})...`);
        await qdrantClient.createCollection(collectionId, {
          vectors: {
            size: 3072,  // OpenAI embedding dimension
            distance: 'Cosine'
          }
        });
      } else {
        console.log(`Collection ${collectionId} already exists`);
      }
      
      if (queries.length === 0) {
        console.log(`No tickets for ${customId} - skipping`);
        continue;
      }
      
      // For products, add product description as a special record
      if (!isCategory && description) {
        const descriptionVector = await embeddingService.createEmbedding(description);
        
        try {
          await qdrantClient.upsert(collectionId, {
            wait: true,
            points: [{
              id: uuidv4(),
              vector: descriptionVector,
              payload: {
                text: description,
                metadata: {
                  type: 'description',
                  product_name: customId
                }
              }
            }]
          });
          
          console.log(`Added product description for ${customId}`);
        } catch (err) {
          console.error(`Failed to add description for ${customId}:`, err);
        }
      }
      
      // Generate vectors for queries
      const vectors = await Promise.all(queries.map(async (query) => {
        return await embeddingService.createEmbedding(query);
      }));
      
      // Upload tickets
      await qdrantClient.upsert(collectionId, {
        wait: true,
        batch: {
          ids: queries.map(() => uuidv4()),
          vectors: vectors,
          payloads: queries.map((query, i) => ({
            ticket_id: `${customId}_ticket_${i}`,
            query: query,
            metadata: {
              type: 'ticket',
              collection: customId,
              category: isCategory ? 'category' : 'product'
            }
          }))
        }
      });
      
      console.log(`Added ${queries.length} tickets to collection ${collectionId} (${customId})`);
    }
    
    console.log('Successfully uploaded all tickets to Qdrant');
    
  } catch (error) {
    console.error('Error during import:', error);
    throw error;
  } finally {
    await pgClient.end();
    console.log('PostgreSQL connection closed');
  }
}

// Run the import
importToQdrant().catch(err => {
  console.error('Import failed:', err);
  process.exit(1);
}); 