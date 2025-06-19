import { In, Repository } from "typeorm";
import { Category } from "../models/Category.entity.js";
import { AppDataSource } from "../../database/typeorm-db.js";

export class CategoryRepository {
  private repository: Repository<Category>;

  constructor() {
    this.repository = AppDataSource.getRepository(Category);
  }

  async findAll(): Promise<Category[]> {
    return this.repository.find();
  }

  async findById(id: string): Promise<Category | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findByIdWithRelated(id: string): Promise<Category | null> {
    return this.repository.findOne({
      where: { id },
      relations: ["products"]
    });
  }

  async findByIdsWithDocuments(ids: string[]): Promise<Category[]> {
    return this.repository.find({
      where: { id: In(ids) },
      relations: ["documents"]
    });
  }

  async create(category: Partial<Category>): Promise<Category> {
    const newCategory = this.repository.create(category);
    return this.repository.save(newCategory);
  }

  async update(id: string, category: Partial<Category>): Promise<Category | null> {
    await this.repository.update(id, category);
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return result.affected > 0;
  }
}
