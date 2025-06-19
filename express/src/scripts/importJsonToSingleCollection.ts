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

// Collection name
const COLLECTION_NAME = 'default_tenant';

// Concurrency settings
const MAX_CATEGORY_CONCURRENCY = 3;  // Process this many categories/products in parallel
const MAX_TICKET_BATCH_SIZE = 10;    // Process this many tickets in a single batch
const QDRANT_BATCH_SIZE = 100;       // Upload this many points at once to Qdrant

interface CategoryData {
  custom_id: string;
  queries: string[];
}

interface Point {
  id: string;
  vector: number[];
  payload: {
    text: string;
    ref_id: string;
    ref_type: 'category' | 'product';
    name: string;
    [key: string]: any;
  };
}

async function importToSingleCollection() {
  console.log('Starting import to single Qdrant collection...');
  
  // Read the formatted JSON file
  if (!fs.existsSync(formattedJsonPath)) {
    throw new Error(`Formatted JSON file not found at: ${formattedJsonPath}`);
  }
  
  const formattedTickets: CategoryData[] = JSON.parse(fs.readFileSync(formattedJsonPath, 'utf-8'));
  console.log(`Loaded ${formattedTickets.length} categories from JSON file`);
  
  // Connect to PostgreSQL
  const pgClient = new pg.Client({
    connectionString: process.env.DATABASE_URL,
    // Increase idle timeout
    idle_in_transaction_session_timeout: 60000 * 5, // 5 minutes
    query_timeout: 60000 * 10 // 10 minutes
  });
  
  // Connect to Qdrant
  const qdrantClient = new QdrantClient({
    url: process.env.QDRANT_URL || 'http://localhost:6333',
    timeout: 60000 * 2 // 2 minute timeout
  });
  
  // Keep PostgreSQL connection alive
  const pgKeepAliveInterval = setInterval(async () => {
    try {
      await pgClient.query('SELECT 1');
      console.log('📡 PostgreSQL connection keep-alive ping');
    } catch (err) {
      console.error('Keep-alive ping failed:', err);
    }
  }, 30000); // Every 30 seconds
  
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
    const idMap: Record<string, { id: string, name: string, description?: string }> = {
      'Laptop': { id: laptopCategoryId, name: 'Laptop' },
      'WindowsOS': { id: windowsOSCategoryId, name: 'WindowsOS' },
      'macOS': { id: macOSCategoryId, name: 'macOS' }
    };
    
    // Add product IDs to the map
    for (const product of laptopProducts.rows) {
      idMap[product.name] = { 
        id: product.id, 
        name: product.name,
        description: product.description 
      };
    }
    
    // Check if collection exists, create if not
    const collections = await qdrantClient.getCollections();
    const collectionExists = collections.collections.some(c => c.name === COLLECTION_NAME);
    
    if (!collectionExists) {
      console.log(`Creating collection ${COLLECTION_NAME}...`);
      await qdrantClient.createCollection(COLLECTION_NAME, {
        vectors: {
          size: 3072, // OpenAI embedding dimension
          distance: 'Cosine'
        }
      });
    } else {
      console.log(`Collection ${COLLECTION_NAME} already exists`);
    }
    
    // Function to upload a batch of points
    async function uploadBatch(points: Point[]) {
      if (points.length === 0) return;
      
      try {
        await qdrantClient.upsert(COLLECTION_NAME, {
          wait: true,
          points: points
        });
        console.log(`✅ Uploaded batch of ${points.length} points`);
      } catch (err) {
        console.error(`❌ Failed to upload batch of ${points.length} points:`, err);
      }
    }
    
    // Process queries in parallel batches for a single category/product
    async function processQueries(
      dbId: string, 
      customId: string, 
      isCategory: boolean, 
      queries: string[]
    ): Promise<Point[]> {
      console.log(`🔄 Processing ${queries.length} tickets for ${customId}...`);
      
      const points: Point[] = [];
      const uploadPromises: Promise<void>[] = [];
      let currentBatch: Point[] = [];
      
      // Process tickets in batches for parallel embedding generation
      for (let i = 0; i < queries.length; i += MAX_TICKET_BATCH_SIZE) {
        const batch = queries.slice(i, i + MAX_TICKET_BATCH_SIZE);
        console.log(`  Processing batch ${Math.floor(i / MAX_TICKET_BATCH_SIZE) + 1}/${Math.ceil(queries.length / MAX_TICKET_BATCH_SIZE)} for ${customId}`);
        
        // Process this batch in parallel
        const batchResults = await Promise.all(batch.map(async (query, batchIndex) => {
          try {
            const vector = await embeddingService.createEmbedding(query);
            return {
              id: uuidv4(),
              vector: vector,
              payload: {
                text: query,
                ref_id: dbId,
                ref_type: isCategory ? 'category' : 'product',
                name: customId,
                ticket_index: i + batchIndex
              }
            };
          } catch (err) {
            console.error(`Failed to process ticket ${i + batchIndex} for ${customId}:`, err);
            return null;
          }
        }));
        
        // Filter out nulls and add to points
        const validPoints = batchResults.filter(p => p !== null) as Point[];
        points.push(...validPoints);
        
        // Add to current batch for upload
        currentBatch.push(...validPoints);
        
        // If batch is full, upload it
        if (currentBatch.length >= QDRANT_BATCH_SIZE) {
          const batchToUpload = [...currentBatch];
          currentBatch = [];
          uploadPromises.push(uploadBatch(batchToUpload));
        }
      }
      
      // Upload any remaining points
      if (currentBatch.length > 0) {
        uploadPromises.push(uploadBatch(currentBatch));
      }
      
      // Wait for all uploads to complete
      await Promise.all(uploadPromises);
      return points;
    }
    
    // Process a single category/product
    async function processItem(item: CategoryData): Promise<number> {
      const customId = item.custom_id;
      const queries = item.queries;
      
      if (!idMap[customId]) {
        console.log(`❌ No ID mapping found for: ${customId} - skipping`);
        return 0;
      }
      
      const dbId = idMap[customId].id;
      const name = idMap[customId].name;
      const description = idMap[customId].description;
      const isCategory = customId === 'Laptop' || customId === 'WindowsOS' || customId === 'macOS';
      
      console.log(`🔄 Starting ${isCategory ? 'category' : 'product'}: ${customId} (ID: ${dbId}) with ${queries.length} tickets`);
      
      let pointCount = 0;
      
      // For products, add description
      if (!isCategory && description) {
        try {
          console.log(`Adding description for ${customId}...`);
          const descriptionVector = await embeddingService.createEmbedding(description);
          
          const descriptionPoint: Point = {
            id: uuidv4(),
            vector: descriptionVector,
            payload: {
              text: description,
              ref_id: dbId,
              ref_type: 'product',
              name: customId
            }
          };
          
          await uploadBatch([descriptionPoint]);
          pointCount++;
        } catch (err) {
          console.error(`Failed to add description for ${customId}:`, err);
        }
      }
      
      // Process queries with parallel batching
      if (queries.length > 0) {
        const points = await processQueries(dbId, customId, isCategory, queries);
        pointCount += points.length;
      }
      
      console.log(`✅ Completed ${customId}: processed ${pointCount} points`);
      return pointCount;
    }
    
    // Process categories/products with limited concurrency
    let totalPointCount = 0;
    const startTime = Date.now();
    
    for (let i = 0; i < formattedTickets.length; i += MAX_CATEGORY_CONCURRENCY) {
      const batch = formattedTickets.slice(i, i + MAX_CATEGORY_CONCURRENCY);
      console.log(`\n🔄 Processing batch of ${batch.length} categories/products (${i+1}-${Math.min(i+MAX_CATEGORY_CONCURRENCY, formattedTickets.length)} of ${formattedTickets.length})`);
      
      const results = await Promise.all(batch.map(item => processItem(item)));
      const batchPointCount = results.reduce((a, b) => a + b, 0);
      totalPointCount += batchPointCount;
      
      const elapsedMinutes = (Date.now() - startTime) / (1000 * 60);
      const pointsPerMinute = totalPointCount / elapsedMinutes;
      const estimatedTotalTime = formattedTickets.length / (i + batch.length) * elapsedMinutes;
      const estimatedTimeRemaining = estimatedTotalTime - elapsedMinutes;
      
      console.log(`\n📊 Progress: ${i + batch.length}/${formattedTickets.length} categories, ${totalPointCount} points`);
      console.log(`⏱️ Time elapsed: ${elapsedMinutes.toFixed(2)} minutes`);
      console.log(`⚡ Speed: ${pointsPerMinute.toFixed(2)} points/minute`);
      console.log(`🔮 Estimated time remaining: ${estimatedTimeRemaining.toFixed(2)} minutes\n`);
    }
    
    console.log(`\n🎉 Successfully uploaded ${totalPointCount} points to collection ${COLLECTION_NAME}`);
    console.log(`⏱️ Total time: ${((Date.now() - startTime) / (1000 * 60)).toFixed(2)} minutes`);
    
  } catch (error) {
    console.error('Error during import:', error);
    throw error;
  } finally {
    clearInterval(pgKeepAliveInterval);
    await pgClient.end();
    console.log('PostgreSQL connection closed');
  }
}

// Run the import
importToSingleCollection().catch(err => {
  console.error('Import failed:', err);
  process.exit(1);
}); 