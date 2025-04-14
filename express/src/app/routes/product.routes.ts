import { Router } from 'express';
import ProductController from '../controllers/ProductController.js';

export default class ProductRoutes {
  private router: Router;
  private productController: ProductController;
  
  constructor() {
    this.router = Router();
    this.productController = new ProductController();
    this.setupRoutes();
  }
  
  private setupRoutes() {
    // Search endpoint (must come before /:id to avoid conflicts)
    this.router.get('/search', this.productController.searchProducts.bind(this.productController));
    
    // GET all products
    this.router.get('/', this.productController.getAllProducts.bind(this.productController));
    
    // GET product by ID
    this.router.get('/:id', this.productController.getProductById.bind(this.productController));
    
    // POST create product (with image upload)
    this.router.post(
      '/',
      this.productController.getImageUploadMiddleware(),
      this.productController.createProduct.bind(this.productController)
    );
    
    // PUT update product (with image upload)
    this.router.put(
      '/:id',
      this.productController.getImageUploadMiddleware(),
      this.productController.updateProduct.bind(this.productController)
    );
    
    // DELETE product
    this.router.delete('/:id', this.productController.deleteProduct.bind(this.productController));
  }
  
  public getRoutes(): Router {
    return this.router;
  }
} 