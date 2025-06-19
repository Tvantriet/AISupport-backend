import { Repository, In } from "typeorm";
import { Document } from "../models/Document.entity.js";
import { AppDataSource } from "../../database/typeorm-db.js";

export class DocumentRepository {
  private repository: Repository<Document>;

  constructor() {
    this.repository = AppDataSource.getRepository(Document);
  }

  async findAll(): Promise<Document[]> {
    return this.repository.find();
  }

  async create(document: Partial<Document>): Promise<Document> {
    const newDocument = this.repository.create(document);
    return this.repository.save(newDocument);
  }

  //get all by product or category id
  async findByParentId(parentId: string): Promise<Document[]> {
    return this.repository.find({ 
      where: [
        { product: {id: parentId } },
        { category: {id: parentId } }
      ]
    });
  }

  async update(id: string, document: Document): Promise<Document | null> {
    const result = await this.repository.update(id, document);
    return result.raw[0];
  }

  async findById(id: string): Promise<Document | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findByIds(ids: string[]): Promise<Document[]> {
    if (!ids || ids.length === 0) {
      return [];
    }
    return this.repository.findBy({ id: In(ids) });
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return result.affected > 0;
  }
}
