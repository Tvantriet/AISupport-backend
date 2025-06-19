import { Repository } from "typeorm";
import { Product } from "../models/Product.entity.js";
import { AppDataSource } from "../../database/typeorm-db.js";

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    lastPage: number;
  };
}

export class ProductRepository {
  private repository: Repository<Product>;

  constructor() {
    this.repository = AppDataSource.getRepository(Product);
  }

  async findAll(): Promise<Product[]> {
    return this.repository.find();
  }

  async findById(id: string): Promise<Product | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findByIdWithRelated(id: string): Promise<Product | null> {
    console.log("[repository] findByIdWithRelated: ", id)
    return this.repository.findOne({
      where: { id },
      relations: ['categories', 'documents']
    });
  }

  async findByCategory(category_id: string): Promise<Product[]> {
    return this.repository.find({
      where: { categories: { id: category_id } }
    });
  }

  async search(query: string, page: number = 1, limit: number = 20): Promise<PaginatedResult<Product>> {
    const similarityThreshold = 0.2;
    const offset = (page - 1) * limit;

    const queryBuilder = this.repository.createQueryBuilder("product");

    queryBuilder
      .addSelect("similarity(product.product_name, :query)", "name_similarity")
      .addSelect("similarity(product.description, :query)", "desc_similarity")
      .where("similarity(product.product_name, :query) > :threshold", { query, threshold: similarityThreshold })
      .orWhere("similarity(product.description, :query) > :threshold", { query, threshold: similarityThreshold })
      .orderBy("GREATEST(similarity(product.product_name, :query), similarity(product.description, :query))", "DESC")
      .offset(offset)
      .limit(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    const lastPage = Math.ceil(total / limit);
    return {
      data,
      meta: {
        total,
        page,
        limit,
        lastPage,
      },
    };
  }

  async getPaginated(page: number = 1, limit: number = 20): Promise<PaginatedResult<Product>> {
    const offset = (page - 1) * limit;
    const [data, total] = await this.repository.findAndCount({
      skip: offset,
      take: limit,
    });
    const lastPage = Math.ceil(total / limit);
    return {
      data,
      meta: {
        total,
        page,
        limit,
        lastPage,
      },
    };
  }
  

  async create(product: Partial<Product>): Promise<Product> {
    const newProduct = this.repository.create(product);
    return this.repository.save(newProduct);
  }

  async update(id: string, product: Partial<Product>): Promise<Product | null> {
    await this.repository.update(id, product);
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return result.affected > 0;
  }
} 