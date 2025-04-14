import { Request, Response } from 'express';
import ProductService from '../services/ProductService.js';
import multer from 'multer';
import { DatabaseProvider } from '../interfaces/DatabaseProvider.js';
import { FileStorageProvider } from '../interfaces/FileStorageProvider.js';
import ProductRepository from '../repositories/ProductRepository.js';
import PostgresService from '../services/PostgresService.js';
import R2FileStorage from '../services/R2FileStorage.js';

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

export default class ProductController {
  private productService: ProductService;
  
  constructor(db?: DatabaseProvider, fileStorage?: FileStorageProvider) {
    const database = db || new PostgresService();
    const storage = fileStorage || new R2FileStorage();
    const productRepository = new ProductRepository(database);
    this.productService = new ProductService(productRepository, storage);
  }
  
  /**
   * Get the multer middleware for image uploads
   */
  public getImageUploadMiddleware() {
    return upload.single('image');
  }
  
  /**
   * Get all products
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
   * Get product by ID
   */
  public async getProductById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid product ID'
        });
      }
      
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
   * Update a product
   */
  public async updateProduct(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid product ID'
        });
      }
      
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
   * Delete a product
   */
  public async deleteProduct(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid product ID'
        });
      }
      
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
   * Search products
   */
  public async searchProducts(req: Request, res: Response) {
    try {
      const query = req.query.q as string || '';
      const page = parseInt(req.query.page as string || '1');
      const limit = parseInt(req.query.limit as string || '20');
      
      if (!query.trim()) {
        // If no search term, return paginated list instead
        const results = await this.productService.getPaginatedProducts(page, limit);
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
} 