import { DatabaseProvider } from "../interfaces/DatabaseProvider.js";
import { Product, CreateProductInput, UpdateProductInput } from "../models/Product.js";

export default class ProductRepository {
  constructor(private db: DatabaseProvider) {}
  
  /**
   * Find all products
   */
  async findAll(): Promise<Product[]> {
    return this.db.query<Product>(`
      SELECT id, name, description, image_url AS "imageUrl", 
             image_key AS "imageKey", created_at AS "createdAt", updated_at AS "updatedAt"
      FROM products
      ORDER BY created_at DESC
    `);
  }
  
  /**
   * Find product by ID
   */
  async findById(id: number): Promise<Product | null> {
    return this.db.queryOne<Product>(`
      SELECT id, name, description, image_url AS "imageUrl", 
             image_key AS "imageKey", created_at AS "createdAt", updated_at AS "updatedAt"
      FROM products
      WHERE id = $1
    `, [id]);
  }
  
  /**
   * Create a new product
   */
  async create(data: CreateProductInput & { imageUrl?: string, imageKey?: string }): Promise<Product> {
    const now = new Date();
    
    return this.db.insert<Product>('products', {
      name: data.name,
      description: data.description,
      image_url: data.imageUrl,
      image_key: data.imageKey,
      created_at: now,
      updated_at: now
    });
  }
  
  /**
   * Update a product
   */
  async update(id: number, data: UpdateProductInput & { imageUrl?: string, imageKey?: string }): Promise<boolean> {
    const updateData = {
      ...data,
      image_url: data.imageUrl,
      image_key: data.imageKey,
      updated_at: new Date()
    };
    
    // Remove undefined values
    Object.keys(updateData).forEach(key => 
      updateData[key] === undefined && delete updateData[key]
    );
    
    delete updateData.imageUrl;
    delete updateData.imageKey;
    
    const result = await this.db.update('products', updateData, 'id = $1', [id]);
    return result > 0;
  }
  
  /**
   * Delete a product
   */
  async delete(id: number): Promise<boolean> {
    const result = await this.db.delete('products', 'id = $1', [id]);
    return result > 0;
  }
  
  /**
   * Find products by category
   */
  async findByCategory(category: string): Promise<Product[]> {
    return this.db.query<Product>(`
      SELECT id, name, description, price, image_url AS "imageUrl", 
             image_key AS "imageKey", category, 
             created_at AS "createdAt", updated_at AS "updatedAt"
      FROM products
      WHERE category = $1
      ORDER BY created_at DESC
    `, [category]);
  }
  
  /**
   * Search products by name and description
   * @param query Search query
   * @param page Page number (starting from 1)
   * @param limit Items per page
   * @returns Products matching the search and pagination metadata
   */
  async search(query: string, page: number = 1, limit: number = 20): Promise<{
    products: Product[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    // Sanitize inputs
    const searchTerm = query.trim();
    const pageNum = Math.max(1, page);
    const itemsPerPage = Math.max(1, Math.min(100, limit));
    const offset = (pageNum - 1) * itemsPerPage;
    
    // Add fuzzy matching using trigram similarity
    // This handles misspellings and typos by comparing strings based on character triplets
    const searchSQL = `
      SELECT id, name, description, image_url AS "imageUrl", 
             image_key AS "imageKey", created_at AS "createdAt", updated_at AS "updatedAt",
             GREATEST(
               similarity(name, $1), 
               similarity(description, $1)
             ) AS match_score
      FROM products
      WHERE 
        name % $1 OR 
        description % $1 OR
        name ILIKE $2 OR
        description ILIKE $2
      ORDER BY 
        match_score DESC,
        created_at DESC
      LIMIT $3 OFFSET $4
    `;
    
    // Counting with the same fuzzy logic
    const countSQL = `
      SELECT COUNT(*) as total
      FROM products
      WHERE 
        name % $1 OR 
        description % $1 OR
        name ILIKE $2 OR
        description ILIKE $2
    `;
    
    // Execute both queries in parallel
    const [products, counts] = await Promise.all([
      this.db.query<Product & {match_score: number}>(
        searchSQL, 
        [searchTerm, `%${searchTerm}%`, itemsPerPage, offset]
      ),
      this.db.query<{total: string}>(
        countSQL, 
        [searchTerm, `%${searchTerm}%`]
      )
    ]);
    
    // Parse count result
    const total = parseInt(counts[0]?.total || '0', 10);
    const totalPages = Math.ceil(total / itemsPerPage);
    
    return {
      products: products.map(p => {
        // Remove the match_score property before returning
        const { match_score, ...product } = p;
        return product;
      }),
      total,
      page: pageNum,
      limit: itemsPerPage,
      totalPages
    };
  }
  
  /**
   * Get products with pagination
   * @param page Page number (starting from 1)
   * @param limit Items per page
   * @returns Paginated products and metadata
   */
  async getPaginated(page: number = 1, limit: number = 20): Promise<{
    products: Product[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    // Sanitize inputs
    const pageNum = Math.max(1, page); // Ensure page is at least 1
    const itemsPerPage = Math.max(1, Math.min(100, limit)); // Between 1 and 100
    const offset = (pageNum - 1) * itemsPerPage;
    
    const countSQL = 'SELECT COUNT(*) as total FROM products';
    const productsSQL = `
      SELECT id, name, description, image_url AS "imageUrl", 
             image_key AS "imageKey", created_at AS "createdAt", updated_at AS "updatedAt"
      FROM products
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
    `;
    
    // Execute both queries in parallel
    const [products, counts] = await Promise.all([
      this.db.query<Product>(productsSQL, [itemsPerPage, offset]),
      this.db.query<{total: string}>(countSQL)
    ]);
    
    // Parse count result
    const total = parseInt(counts[0]?.total || '0', 10);
    const totalPages = Math.ceil(total / itemsPerPage);
    
    return {
      products,
      total,
      page: pageNum,
      limit: itemsPerPage,
      totalPages
    };
  }
} 