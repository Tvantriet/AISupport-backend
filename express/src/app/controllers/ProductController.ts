import { Request, Response } from 'express';
import ProductService from '../services/ProductService.js';
import multer from 'multer';
import { DatabaseProvider } from '../interfaces/DatabaseProvider.js';
import { FileStorageProvider } from '../interfaces/FileStorageProvider.js';
import R2FileStorage from '../services/R2FileStorage.js';
import DocumentProcessingService from '../services/DocumentProcessingService.js';
import { ProductRepository } from '../repositories/ProductRepository.js';
import DocumentWorkflowService from '../services/DocumentWorkflowService.js';
import { PointRepository } from '../repositories/PointRepository.js';
import PointService from '../services/PointService.js';
import { DocumentRepository } from '../repositories/DocumentRepository.js';
import DocumentService from '../services/DocumentService.js';
import { AppDataSource } from '../../database/typeorm-db.js';
import { Category } from '../models/Category.entity.js';
import { Product } from '../models/Product.entity.js';
import { Readable } from 'node:stream';

// Configure multer for memory storage (we'll process and send to R2)
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Add near the top with your other multer configurations
const batchFileUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only jsonl files or text
    if (file.mimetype === 'application/jsonl' || 
        file.mimetype === 'text/plain' || 
        file.mimetype === 'application/octet-stream') {
      cb(null, true);
    } else {
      cb(new Error('Only JSONL or text files are allowed'));
    }
  }
});

// Helper interfaces (can be moved to a DTOs file later)
interface BatchResponse {
  custom_id: string;
  response?: {
    status_code: number;
    request_id: string;
    body: {
      choices: Array<{
        message: {
          role: string;
          content: string; // This is a JSON string
        };
      }>;
    };
  };
  error?: any;
}

interface TicketData {
  tickets: Array<Array<{ userMessage: string; assistantMessage: string }>>;
}

function createMockReadableStreamForController(buffer: Buffer): Readable {
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null); // Signifies end of stream
  return stream;
}

export default class ProductController {
  private productService: ProductService;
  private productRepository: ProductRepository;
  private documentWorkflowService: DocumentWorkflowService;
  private pointRepository: PointRepository;
  private pointService: PointService;
  private documentRepository: DocumentRepository;
  private documentService: DocumentService;
  private documentProcessingService: DocumentProcessingService;
  
  constructor(db?: DatabaseProvider, fileStorage?: FileStorageProvider) {
    const storage = fileStorage || new R2FileStorage();
    this.productRepository = new ProductRepository();
    this.productService = new ProductService(this.productRepository, storage);
    this.pointRepository = new PointRepository();

    this.pointService = new PointService(this.pointRepository);
    this.documentRepository = new DocumentRepository();
    this.documentService = new DocumentService(this.documentRepository);
    this.documentProcessingService = new DocumentProcessingService();
    this.documentWorkflowService = new DocumentWorkflowService(this.documentService, this.pointService, this.documentProcessingService, this.productService);

  }
  
  /**
   * Get the multer middleware for image uploads
   */
  public getImageUploadMiddleware() {
    return upload.single('image');
  }
  
  /**
   * Get all products with optional pagination
   * Returns a list of all products in the database
   * 
   * @param req Express request object
   * @param res Express response object
   * @returns JSON response with array of products
   */
  public async getAllProducts(req: Request, res: Response) {
    try {
      
      const products = await this.productService.getAllProducts();
      res.json({
        success: true,
        data: products
      });
    } catch (error) {
      console.error('Error getting products:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get products',
        error: error
      });
    }
  }
  
  /**
   * Get a single product by ID
   * Returns detailed information about a specific product
   * 
   * @param req Express request object containing product ID in params
   * @param res Express response object
   * @returns JSON response with product data or error
   */
  public async getProductById(req: Request, res: Response) {
    try {
      const id = req.params.id;
            
      const product = await this.productService.getProductById(id);
      
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }
      
      res.json({
        success: true,
        data: product
      });
    } catch (error) {
      console.error('Error getting product:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get product',
        error: error
      });
    }
  }
  
  /**
   * Create a new product
   * Handles product creation with optional image upload
   * 
   * @param req Express request object containing product data in body and optional image file
   * @param res Express response object
   * @returns JSON response with created product or error
   */
  public async createProduct(req: Request, res: Response) {
    try {
      const { name, description } = req.body;
      
      // Validate required fields
      if (!name || !description) {
        return res.status(400).json({
          success: false,
          message: 'Name and description are required'
        });
      }
      
      // Get image from multer if available
      const image = req.file ? req.file.buffer : undefined;
      
      const product = await this.productService.createProduct({
        name,
        description,
        image
      });
      
      res.status(201).json({
        success: true,
        data: product
      });
    } catch (error) {
      console.error('Error creating product:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create product',
        error: error
      });
    }
  }
  
  /**
   * Handles product updates with optional image upload
   * !To-do: Remove image file processing, add separate function for editing sources (docs)
   * 
   * @param req Express request object containing product ID in params, update data in body, and optional image file
   * @param res Express response object
   * @returns JSON response with updated product or error
   */
  public async updateProduct(req: Request, res: Response) {
    try {
      const id = req.params.id;
      
      const { name, description } = req.body;
      
      // Get image from multer if available
      const image = req.file ? req.file.buffer : undefined;
      
      const product = await this.productService.updateProduct(id, {
        name,
        description,
        image
      });
      
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }
      
      res.json({
        success: true,
        data: product
      });
    } catch (error) {
      console.error('Error updating product:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update product',
        error: error
      });
    }
  }
  
  /**
   * Removes a product and its associated image from storage
   * 
   * @param req Express request object containing product ID in params
   * @param res Express response object
   * @returns JSON response with success message or error
   */
  public async deleteProduct(req: Request, res: Response) {
    try {
      const id = req.params.id;
      
      const result = await this.productService.deleteProduct(id);
      
      if (!result) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }
      
      res.json({
        success: true,
        message: 'Product deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting product:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete product',
        error: error
      });
    }
  }
  
  /**
   * Performs a fuzzy search on product names and descriptions
   * If no search query is provided, returns paginated list of all products
   * 
   * @param req Express request object containing search query (q), page number, and limit in query params
   * @param res Express response object
   * @returns JSON response with search results and pagination metadata
   */
  public async searchProducts(req: Request, res: Response) {
    try {
      const query = req.query.q as string || '';
      const page = parseInt(req.query.page as string || '1');
      const limit = parseInt(req.query.limit as string || '20');
      console.log(`[SEARCH] Searching for "${query}" on page ${page} with limit ${limit}`);

      if (!query.trim()) {
        // If no search term, return paginated list instead
        const results = await this.productService.getPaginatedProducts(page, limit);
        console.log(`[SEARCH] Found ${results.data.length} products on page ${page}`);
        return res.json({
          success: true,
          ...results
        });
      }

      const results = await this.productService.searchProducts(query, page, limit);
      
      res.json({
        success: true,
        ...results
      });
    } catch (error) {
      console.error('Error searching products:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to search products',
        error
      });
    }
  }
  
  /**
   * Add documents to a product's vector storage
   * 
   * @param req Express request object containing product ID and documents
   * @param res Express response object
   */
  public async addDocuments(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { documents } = req.body;
      
      if (!Array.isArray(documents)) {
        return res.status(400).json({
          success: false,
          message: 'Documents must be an array'
        });
      }

      // Process and add documents
      const result = await this.documentWorkflowService.addDocuments(
        id,
        "product",
        documents
      );

      res.json({
        success: true,
        message: `Added ${documents.length} documents to product ${id}`,
        result
      });
    } catch (error) {
      console.error('Error adding documents:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add documents',
        error
      });
    }
  }

  public getBatchFileUploadMiddleware() {
    console.log('getBatchFileUploadMiddleware');
    return batchFileUpload.single('jsonlContent');
  }

  /**
   * Process a batch of AI-generated ticket data from JSONL content.
   * The JSONL content is expected as a single string in req.body.jsonlContent
   */
  public async processBatchImport(req: Request, res: Response) {
    console.log('processBatchImport called, req:', req.file ? 'file exists' : 'no file');

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Missing file. Please upload a JSONL file with field name "jsonlContent".',
      });
    }
    const jsonlContent = req.file.buffer.toString('utf-8');


    const lines = jsonlContent.split('\n');
    let allProducts: Product[] = [];
    let allCategories: Category[] = [];
    let processedCount = 0;
    let errorCount = 0;
    const errors: { customId?: string, error: string, line?: string }[] = [];

    try {
      // Fetch all products and categories once
      // Note: productService.getAllProducts() returns DTOs. For matching by name/ID from entity, direct fetch is better here.
      allProducts = await AppDataSource.getRepository(Product).find();
      allCategories = await AppDataSource.getRepository(Category).find();
      console.log(`[ProductController.processBatchImport] Fetched ${allProducts.length} products and ${allCategories.length} categories.`);
    } catch (fetchError: any) {
      console.error('[ProductController.processBatchImport] Error fetching products/categories:', fetchError);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch initial product/category data.',
        error: fetchError.message,
      });
    }

    for (const line of lines) {
      if (!line.trim()) continue;

      try {
        const batchItem = JSON.parse(line) as BatchResponse;

        if (batchItem.error || !batchItem.response || batchItem.response.status_code !== 200) {
          console.error(
            `[ProductController.processBatchImport] Skipping item due to error or non-200 status. Custom ID: ${batchItem.custom_id}`,
            batchItem.error || `Status: ${batchItem.response?.status_code}`
          );
          errorCount++;
          errors.push({ customId: batchItem.custom_id, error: `Batch item error or non-200 status: ${batchItem.error || batchItem.response?.status_code}`, line });
          continue;
        }

        const contentString = batchItem.response.body.choices[0]?.message?.content;
        if (!contentString) {
          console.error(`[ProductController.processBatchImport] No content string found for Custom ID: ${batchItem.custom_id}`);
          errorCount++;
          errors.push({ customId: batchItem.custom_id, error: 'No content string in AI response', line });
          continue;
        }

        let ticketData: TicketData;
        try {
          ticketData = JSON.parse(contentString);
        } catch (jsonParseError: any) {
          console.error(`[ProductController.processBatchImport] Failed to parse content JSON for Custom ID: ${batchItem.custom_id}`, jsonParseError);
          errorCount++;
          errors.push({ customId: batchItem.custom_id, error: `Failed to parse AI content JSON: ${jsonParseError.message}`, line });
          continue;
        }

        if (!ticketData || !Array.isArray(ticketData.tickets) || ticketData.tickets.length === 0) {
          console.warn(`[ProductController.processBatchImport] No tickets found in parsed content for Custom ID: ${batchItem.custom_id}`);
          // Not necessarily an error, could be an empty valid response.
          continue;
        }

        const customIdParts = batchItem.custom_id.split('_');
        const type = customIdParts[1];
        const entityIdFromCustomId = customIdParts[2];
        const entityNameFromCustomId = customIdParts.slice(3, customIdParts.length - 1).join('_');

        let referenceId: string | undefined;
        let referenceType: 'product' | 'category' | undefined;

        if (type === 'product') {
          const product = allProducts.find(p => p.id === entityIdFromCustomId || p.product_name === entityNameFromCustomId);
          if (product) {
            referenceId = product.id;
            referenceType = 'product';
          }
        } else if (type === 'category') {
          const category = allCategories.find(c => c.id === entityIdFromCustomId || c.name === entityNameFromCustomId);
          if (category) {
            referenceId = category.id;
            referenceType = 'category';
          }
        }

        if (!referenceId || !referenceType) {
          console.warn(`[ProductController.processBatchImport] Could not find matching Product/Category for custom_id: ${batchItem.custom_id}. Type: ${type}, ID: ${entityIdFromCustomId}, Name: ${entityNameFromCustomId}. Skipping.`);
          errorCount++;
          errors.push({ customId: batchItem.custom_id, error: 'Could not match custom_id to product/category', line });
          continue;
        }

        for (let i = 0; i < ticketData.tickets.length; i++) {
          const ticketThread = ticketData.tickets[i];
          const combinedText = ticketThread.map(msg => `User: ${msg.userMessage}\nAssistant: ${msg.assistantMessage}`).join('\n\n---\n\n');
          const buffer = Buffer.from(combinedText, 'utf-8');

          const pseudoFile: Express.Multer.File = {
            originalname: `ticket_thread_${i + 1}_${referenceType}_${referenceId}_${batchItem.custom_id}.txt`,
            mimetype: 'text/plain',
            buffer: buffer,
            size: buffer.length,
            fieldname: 'file',
            encoding: 'utf-8',
            destination: '',
            filename: 'Artificial Ticket num ' + i,
            path: '',
            stream: createMockReadableStreamForController(buffer)
          };

          try {
            await this.documentWorkflowService.addDocuments(referenceId, referenceType, [pseudoFile]);
            console.log(`[ProductController.processBatchImport] Successfully processed and added document for ticket thread ${i + 1}, Custom ID: ${batchItem.custom_id}, Ref: ${referenceType} ${referenceId}`);
            processedCount++;
          } catch (serviceError: any) {
            console.error(`[ProductController.processBatchImport] DocumentWorkflowService.addDocuments failed for ticket thread ${i + 1}, Custom ID: ${batchItem.custom_id}`, serviceError);
            errorCount++;
            errors.push({ customId: batchItem.custom_id, error: `addDocuments failed: ${serviceError.message}`, line });
          }
        }
      } catch (lineProcessingError: any) {
        console.error('[ProductController.processBatchImport] Error processing line:', line, lineProcessingError);
        errorCount++;
        errors.push({ error: `Outer error processing line: ${lineProcessingError.message}`, line });
      }
    }

    res.json({
      success: true,
      message: `Batch import processing finished. Processed: ${processedCount}, Errors: ${errorCount}.`,
      totalLines: lines.length,
      errors: errors, // Includes lines that caused errors for review
    });
  }
} 