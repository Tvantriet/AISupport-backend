import { FileStorageProvider } from "../interfaces/FileStorageProvider.js";
import { ProductRepository } from "../repositories/ProductRepository.js";
import { CreateProductInput, Product as ProductDTO, UpdateProductInput } from "../dtos/product.dto.js";
import { Product } from "../models/Product.entity.js"; // Import Entity
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import R2FileStorage from "./R2FileStorage.js";

export default class ProductService {
  constructor(
    private productRepository?: ProductRepository,
    private fileStorage?: FileStorageProvider
  ) {
    this.productRepository = productRepository || new ProductRepository();
    this.fileStorage = fileStorage || new R2FileStorage();
  }

  private mapEntityToDto(entity: Product): ProductDTO {
    return {
        id: entity.id,
        name: entity.product_name, // Map database column name
        description: entity.description,
        imageUrl: entity.image_url,
    };
}
  /**
   * Get all products
   */
  async getAllProducts(): Promise<ProductDTO[]> {
    const entities = await this.productRepository.findAll();
    return entities.map(entity => this.mapEntityToDto(entity)); // Map entities to DTOs

  }
  
  /**
   * Get product by ID
   */
  async getProductById(id: string): Promise<ProductDTO | null> {
    const entity = await this.productRepository.findById(id);
    return entity ? this.mapEntityToDto(entity) : null;
  }


  /**
   * Get category IDs for a product
   */
  async getCategoryIds(productId: string): Promise<string[]> {
    console.log("product with categories: ", productId)

    const product = await this.productRepository.findByIdWithRelated(productId);
    return product.categories.map((category) => category.id);
  }

  /**
   * Create a new product with optional image upload
   */
  async createProduct(productData: CreateProductInput): Promise<Product> {
    try {
      // Handle image upload if present
      let imageUrl, imageKey;
      
      if (productData.image) {
        // Generate a unique filename
        const extension = this.detectImageExtension(productData.image);
        const filename = `products/${uuidv4()}${extension}`;
        
        // Upload to R2
        imageUrl = await this.fileStorage.uploadFile(
          productData.image,
          filename,
          { contentType: `image/${extension.substring(1)}` }
        );
        
        imageKey = filename;
      }
      
      // Create product in database
      const product = await this.productRepository.create({
        ...productData,
        image_url: imageUrl,
      });
      
      return product;
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  }
  
  /**
   * Update a product with optional image upload
   */
  async updateProduct(id: string, productData: UpdateProductInput): Promise<Product | null> {
    try {
      // Get existing product
      const existingProduct = await this.productRepository.findById(id);
      
      if (!existingProduct) {
        return null;
      }
      
      // Handle image upload if present
      let imageUrl = existingProduct.image_url;
      let imageKey = existingProduct.image_key;
      
      if (productData.image) {
        // Delete old image if exists
        if (existingProduct.image_key) {
          await this.fileStorage.deleteFile(existingProduct.image_key);
        }
        
        // Generate a unique filename
        const extension = this.detectImageExtension(productData.image);
        const filename = `products/${uuidv4()}${extension}`;
        
        // Upload to R2
        imageUrl = await this.fileStorage.uploadFile(
          productData.image,
          filename,
          { contentType: `image/${extension.substring(1)}` }
        );
        
        imageKey = filename;
      }
      
      // Update product in database
      await this.productRepository.update(id, {
        ...productData,
        image_url: imageUrl,
        image_key: imageKey,
      });
      
      return this.productRepository.findById(id);
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  }
  
  /**
   * Delete a product and its image
   */
  async deleteProduct(id: string): Promise<boolean> {
    try {
      // Get existing product
      const existingProduct = await this.productRepository.findById(id);
      
      if (!existingProduct) {
        return false;
      }
      
      // Delete image if exists
      if (existingProduct.image_key) {
        await this.fileStorage.deleteFile(existingProduct.image_key);
      }
      
      // Delete from database
      return await this.productRepository.delete(id);
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  }
  
  /**
   * Get products by category
   */
  async getProductsByCategory(category: string): Promise<ProductDTO[]> {
    const entities = await this.productRepository.findByCategory(category);
    return entities.map(entity => this.mapEntityToDto(entity)); // Map entities to DTOs
  }
  
  /**
   * Detect image extension from buffer
   */
  private detectImageExtension(buffer: Buffer): string {
    // Simple magic number detection for common image formats
    if (buffer.length < 4) return '.bin';
    
    // JPEG starts with FF D8 FF
    if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
      return '.jpg';
    }
    
    // PNG starts with 89 50 4E 47 (‰PNG)
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
      return '.png';
    }
    
    // GIF starts with 47 49 46 38 (GIF8)
    if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38) {
      return '.gif';
    }
    
    // WebP starts with 52 49 46 46 (RIFF) followed by filesize and WEBP
    if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46) {
      if (buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50) {
        return '.webp';
      }
    }
    
    // Default to jpg if unknown
    return '.jpg';
  }
  
  /**
   * Search products by name or description
   * @param query Search query
   * @param page Page number
   * @param limit Results per page
   * @returns Search results with pagination metadata
   */
  async searchProducts(query: string, page: number = 1, limit: number = 20) {
    console.log(`[SEARCH] Searching for "${query}" on page ${page} with limit ${limit}`);
    return this.productRepository.search(query, page, limit);
  }
  
  /**
   * Get paginated products
   * @param page Page number
   * @param limit Results per page
   * @returns Paginated products with metadata
   */
  async getPaginatedProducts(page: number = 1, limit: number = 20) {
    return this.productRepository.getPaginated(page, limit);
  }
} 