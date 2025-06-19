import { Repository } from "typeorm";
import { Point } from "../models/Point.entity.js";
import { AppDataSource } from "../../database/typeorm-db.js";
import pgvector from 'pgvector';

export class PointRepository {
  private repository: Repository<Point>;

  constructor() {
    this.repository = AppDataSource.getRepository(Point);
  }
  async createPoints(points: Partial<Point>[]): Promise<Point[]> {
    const pointEntities = points.map(p => this.repository.create(p));
    return this.repository.save(pointEntities, { chunk: 100 });
  }

  async findNearestNeighbors(productId: string, categoryIds: string[], embedding: number[], limit: number = 5): Promise<(Point & { distance: number })[]> {
    return this.repository.createQueryBuilder("point")
        .innerJoin("point.document", "doc")
        .where(qb => {
            const subQuery = qb.subQuery()
                .select("d.id")
                .from("documents", "d")
                .leftJoin("d.product", "p")
                .leftJoin("d.category", "c")
                .where("p.id = :productId")
                .orWhere("c.id IN (:...categoryIds)")
                .getQuery();
            return "doc.id IN " + subQuery;
        })
        .setParameters({ productId, categoryIds })
        .orderBy(`point.embedding <=> :embedding::vector`, "ASC")
        .setParameter("embedding", `[${embedding.join(",")}]`)
        .limit(limit)
        .getMany() as Promise<(Point & { distance: number })[]>;
  }

  async getPointsByDocumentId(documentId: string): Promise<Point[]> {
    return this.repository.find({ where: { document_id: documentId } });
  }

  async getPointsById(id: string): Promise<Point> {
    return this.repository.findOne({ where: { id } });
  }
  
}