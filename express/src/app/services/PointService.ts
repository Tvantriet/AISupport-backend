//service layer for point entity
import { PointRepository } from "../repositories/PointRepository.js";
import { Point } from "../models/Point.entity.js";
import { CreatePointInput, PointDTOWithDistance, PointOutput} from "../dtos/point.dto.js";

export default class PointService {
	constructor(private pointRepository?: PointRepository) {
        this.pointRepository = pointRepository || new PointRepository();
    }

	async createPoints(pointsData: CreatePointInput[]): Promise<Point[]> {
		const partialPoints: Partial<Point>[] = pointsData.map(dto => ({
			embedding: dto.embedding,
			content: dto.content,
			index: dto.index,
			document_id: dto.document_id,
		})); 
		return this.pointRepository.createPoints(partialPoints);
	}

	async findNearestNeighbors(productId: string, categoryIds: string[], embedding: number[], limit: number = 5): Promise<PointDTOWithDistance[]> {
		const pointsWithDistance = await this.pointRepository.findNearestNeighbors(productId, categoryIds, embedding, limit);
		if(pointsWithDistance.length === 0){
			return [];
		}

		return pointsWithDistance.map(point => ({
			point: point,
			distance: point.distance
		}));	}

	async getPointsByDocumentId(documentId: string): Promise<Point[]> {
		return this.pointRepository.getPointsByDocumentId(documentId);
	}

	async getPointsById(id: string): Promise<Point> {
		return this.pointRepository.getPointsById(id);
	}
}

