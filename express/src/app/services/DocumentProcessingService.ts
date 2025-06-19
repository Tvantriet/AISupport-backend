import { EmbeddingProvider } from "../interfaces/EmbeddingProvider.js";
import { AIProvider } from "../interfaces/AIProvider.js";
import OpenAIEmbeddingService from "./OpenAIEmbeddingService.js";
import OpenAIService from "./OpenAIService.js";
import TextProcessingService from "./TextProcessingService.js";
import { CreatePointInput } from "../dtos/point.dto.js";
import { CreatePointsForDocument } from "../dtos/document.dto.js";

/**
 * Handles document processing workflow from
 * text and metadataextraction and vector embedding creation
 */
export default class DocumentProcessingService {
	private embeddingProvider: EmbeddingProvider;
	private aiProvider: AIProvider;
	private textProcessingService: TextProcessingService;

	constructor(
		embeddingProvider?: EmbeddingProvider,
		aiProvider?: AIProvider
	) {
		this.embeddingProvider = embeddingProvider || new OpenAIEmbeddingService();
		this.aiProvider = aiProvider || new OpenAIService();
		this.textProcessingService = new TextProcessingService(this.aiProvider);
	}

	/**
	 * Process files to vector points
	 * Orchestrates the entire flow from text extraction to embedding creation
	 *
	 * @param documents Array of documents to process
	 * @returns Array of points with id, vector, and payload
	 */
	public async CreatePointsForDocument(
		createPointInput: CreatePointsForDocument,
	): Promise<CreatePointInput[]> {
		const content = await this.textProcessingService.extractDocumentContent(createPointInput.content, createPointInput.file_extension);
		const chunks = await this.textProcessingService.splitTextIntoSemanticChunks(content);

		let completedChunks = 0;
		const vectorPoints: CreatePointInput[] = [];
		//asyncrounously create embeddings for each chunk
		for (const chunk of chunks) {
			const embedding: number[] = await this.embeddingProvider.createEmbedding(chunk);
			const point: CreatePointInput = {
				embedding: embedding,
				content: chunk,
				index: completedChunks++,
				document_id: createPointInput.document_id,
			};
			vectorPoints.push(point);
			console.log(`✅ Finished creating chunk: ${completedChunks} for document ${createPointInput.document_id}`);
		}
		return vectorPoints;
	}
}
