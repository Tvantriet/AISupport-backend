import { Category } from "../models/Category.entity.js";
import { CategoryRepository } from "../repositories/CategoryRepository.js";

export default class CategoryService {
  private categoryRepository: CategoryRepository;

  constructor() {
    this.categoryRepository = new CategoryRepository();
  }

  async createCategory(category: Category): Promise<Category> {
    return this.categoryRepository.create(category);
  }

  async getCategoryById(id: string): Promise<Category | null> {
    return this.categoryRepository.findById(id);
  }

  async getCategoryWithDocumentsById(id: string): Promise<Category | null> {
    return this.categoryRepository.findByIdWithRelated(id);
  }

  async getCategoriesWithDocumentsByIds(ids: string[]): Promise<Category[]> {
    if (!ids || ids.length === 0) {
      return [];
    }
    return this.categoryRepository.findByIdsWithDocuments(ids);
  }

  async getCategories(): Promise<Category[]> {
    return this.categoryRepository.findAll();
  }

  async updateCategory(id: string, category: Category): Promise<Category | null> {
    return this.categoryRepository.update(id, category);
  }

  async deleteCategory(id: string): Promise<boolean> {
    return this.categoryRepository.delete(id);
  }
}

