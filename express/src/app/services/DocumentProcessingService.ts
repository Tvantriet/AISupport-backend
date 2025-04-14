import { EmbeddingProvider } from "../interfaces/EmbeddingProvider.js";
import { AIProvider } from "../interfaces/AIProvider.js";
import QdrantService from "./QdrantService.js";
import { v4 as uuidv4 } from 'uuid';
import OpenAIEmbeddingService from "./OpenAIEmbeddingService.js";
import OpenAIService from "./OpenAIService.js";
import TextProcessingService from "./TextProcessingService.js";

/**
 * Orchestrates the document processing workflow from
 * text extraction to vector embedding and storage
 */
export default class DocumentProcessingService {
	private embeddingProvider: EmbeddingProvider;
	private aiProvider: AIProvider;
	private textProcessingService: TextProcessingService;
	public qdrantService: QdrantService;

	constructor(
		embeddingProvider?: EmbeddingProvider,
		aiProvider?: AIProvider,
		qdrantService?: QdrantService
	) {
		this.embeddingProvider = embeddingProvider || new OpenAIEmbeddingService();
		this.aiProvider = aiProvider || new OpenAIService();
		this.qdrantService = qdrantService || new QdrantService();
		this.textProcessingService = new TextProcessingService(this.aiProvider);
	}

	/**
	 * Add documents to an existing collection
	 * 
	 * @param collectionName Name of the collection
	 * @param documents Documents to process and add (can be file paths or document objects)
	 * @returns Result object with status and counts
	 */
	public async addDocumentsToCollection(collectionName: string, documents: any[]): Promise<any> {
		// Check if collection exists
		const exists = await this.qdrantService.collectionExists(collectionName);
		
		if (!exists) {
			throw new Error(`Collection ${collectionName} does not exist`);
		}
		
		if (!documents || documents.length === 0) {
			return {
				success: true,
				documentsAdded: 0,
				chunksCreated: 0,
				message: "No documents provided to add",
			};
		}
		
		// Process documents into vector points
		// Works by splitting the document up into small chunks chunks (40-500 words) grouped by semantic meaning
		const points = await this.processDocumentsToVectorPoints(documents);
		
		// Add points to the collection
		const results = await this.qdrantService.addPoints(collectionName, points);
		
		return {
			success: true,
			documentsAdded: documents.length,
			chunksCreated: points.length,
			results,
		};
	}

	/**
	 * Process documents into vector points for Qdrant - fully parallel version
	 * Orchestrates the entire flow from text extraction to embedding creation
	 *
	 * @param documents Array of documents to process
	 * @returns Array of points with id, vector, and payload
	 */
	protected async processDocumentsToVectorPoints(
		documents: any[],
	): Promise<Array<{ id: string | number; vector: number[]; payload: any }>> {
		console.log(`🔄 Processing ${documents.length} documents`);
		
		// Stage 1: Extract text from all documents in parallel
		console.log(`📑 Stage 1: Extracting text from ${documents.length} documents`);
		const extractionPromises = documents.map(async (document, index) => {
			try {
				const { text, metadata, source } = await this.textProcessingService.extractDocumentContent(document);
				const fileName = source.split('/').pop() || 'document';
				console.log(`📄 Extracted ${text.length} chars from doc ${index + 1}/${documents.length}: ${fileName}`);
				
				return {
					text,
					metadata,
					source,
					documentId: document.id || 
						metadata.id || 
						`doc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
					index
				};
			} catch (error) {
				console.error(`❌ Error extracting document ${index + 1}:`, error);
				return null; // Skip failed documents
			}
		});
		
		const extractedDocs = (await Promise.all(extractionPromises)).filter(doc => doc !== null);
		const totalExtractedChars = extractedDocs.reduce((sum, doc) => sum + doc.text.length, 0);
		console.log(`✅ Extracted ${totalExtractedChars} chars from ${extractedDocs.length}/${documents.length} documents`);
		
		// Stage 2: Split all documents into chunks in parallel
		console.log(`🔪 Stage 2: Splitting ${extractedDocs.length} documents into chunks`);
		const chunkingPromises = extractedDocs.map(async (doc) => {
			try {
				const chunks = await this.textProcessingService.splitTextIntoSemanticChunks(doc.text);
				console.log(`📄 Doc ${doc.index + 1}: Split into ${chunks.length} chunks`);
				
				// Return chunks with document metadata
				return chunks.map((chunk, chunkIndex) => ({
					text: chunk,
					documentId: doc.documentId,
					metadata: doc.metadata,
					source: doc.source,
					docIndex: doc.index,
					chunkIndex,
					totalChunks: chunks.length
				}));
			} catch (error) {
				console.error(`❌ Error chunking document ${doc.index + 1}:`, error);
				return []; // Return empty for failed chunking
			}
		});
		
		// Flatten all chunks from all documents into a single array
		const allChunks = (await Promise.all(chunkingPromises)).flat();
		console.log(`✅ Created ${allChunks.length} total chunks across all documents`);
		
		// Stage 3: Create embeddings for all chunks in parallel
		console.log(`🧠 Stage 3: Creating embeddings for ${allChunks.length} chunks in parallel`);
		
		// Create batches of 20 chunks to avoid overwhelming the Qdrant API
		const BATCH_SIZE = 20;
		const batches = [];
		for (let i = 0; i < allChunks.length; i += BATCH_SIZE) {
			batches.push(allChunks.slice(i, i + BATCH_SIZE));
		}
		
		let completedChunks = 0;
		const vectorPoints = [];
		
		// Process batches sequentially, but chunks within each batch in parallel
		for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
			const batch = batches[batchIndex];
			console.log(`⏳ Processing batch ${batchIndex + 1}/${batches.length} (${batch.length} chunks)`);
			
			const batchPromises = batch.map(async (chunk) => {
				try {
					const embedding = await this.embeddingProvider.createEmbedding(chunk.text);
					completedChunks++;
					
					if (completedChunks % 10 === 0 || completedChunks === allChunks.length) {
						console.log(`⏳ Embedding progress: ${completedChunks}/${allChunks.length} chunks (${Math.round(completedChunks/allChunks.length*100)}%)`);
					}
					
					return {
						id: uuidv4(),
						vector: embedding,
						payload: {
							text: chunk.text,
							documentId: chunk.documentId,
							chunkIndex: chunk.chunkIndex,
							totalChunks: chunk.totalChunks,
							metadata: {
								...chunk.metadata,
								originalDocument: chunk.documentId,
							},
							source: chunk.source,
						},
					};
				} catch (error) {
					console.error(`❌ Error creating embedding for chunk:`, error);
					return null; // Skip failed embeddings
				}
			});
			
			const batchResults = (await Promise.all(batchPromises)).filter(result => result !== null);
			vectorPoints.push(...batchResults);
		}
		
		// Log summary statistics
		const totalChars = allChunks.reduce((sum, chunk) => sum + chunk.text.length, 0);
		const storedChars = vectorPoints.reduce((sum, point) => sum + point.payload.text.length, 0);
		
		console.log(`📊 SUMMARY STATISTICS:`);
		console.log(`📊 Total original characters: ${totalExtractedChars}`);
		console.log(`📊 Total characters in chunks: ${totalChars}`);
		console.log(`📊 Total characters in stored vectors: ${storedChars}`);
		console.log(`📊 Character retention rate: ${((storedChars / totalExtractedChars) * 100).toFixed(2)}%`);
		console.log(`✅ Created ${vectorPoints.length}/${allChunks.length} vector points`);
		
		return vectorPoints;
	}

	/**
	 * Create a new collection with documents
	 *
	 * @param collectionName Name of the collection
	 * @param dimension Dimension of the embedding vectors
	 * @param documents Documents to process and add
	 * @returns Result of the operation
	 */
	public async createCollectionWithDocuments(
		collectionName: string,
		dimension: number,
		documents: any[],
	): Promise<any> {
		try {
			// Check if collection already exists
			const exists = await this.qdrantService.collectionExists(collectionName);

			if (exists) {
				return {
					success: false,
					message: `Collection ${collectionName} already exists`,
				};
			}

			// Create the collection
			await this.qdrantService.createCollection(collectionName, dimension);

			if (documents && documents.length > 0) {
				return await this.addDocumentsToCollection(collectionName, documents);
			}

			return {
				success: true,
				message: `Collection ${collectionName} created successfully`,
			};
		} catch (error: any) {
			console.error(`Error creating collection with documents: ${error.message}`);
			throw new Error(`Failed to create collection with documents: ${error.message}`);
		}
	}
}
