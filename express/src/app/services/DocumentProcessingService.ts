import OpenAIService from "./OpenAIService.js";
import QdrantService from "./QdrantService.js";
import fs from "fs";
import { PDFExtract } from "pdf.js-extract";
import mammoth from "mammoth";
import { v4 as uuidv4 } from 'uuid';

export default class DocumentProcessingService {
	public openaiService: OpenAIService;
	public qdrantService: QdrantService;

	constructor() {
		this.openaiService = new OpenAIService();
		this.qdrantService = new QdrantService();
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
	 * Process documents into vector points for Qdrant
	 *
	 * @param documents Array of documents to process
	 * @returns Array of points with id, vector, and payload
	 */
	protected async processDocumentsToVectorPoints(
		documents: any[],
	): Promise<Array<{ id: string | number; vector: number[]; payload: any }>> {
		const vectorPoints = [];
		let documentIndex = 0;

		for (const document of documents) {
			try {
				documentIndex++;
				console.log(`Processing document ${documentIndex}/${documents.length}`);
				
				// Step 1: Extract text and metadata from document
				const { text, metadata, source } = await this.extractDocumentContent(document);

				// Generate a unique document ID if not provided
				const documentId = document.id || 
					metadata.id || 
					`doc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

				// Step 2: Split text into semantic chunks
				const chunks = await this.splitTextIntoSemanticChunks(text);
				
				console.log(`Document split into ${chunks.length} chunks`);

				// Step 3: Create embeddings for each chunk and format as vector points
				for (let i = 0; i < chunks.length; i++) {
					const chunk = chunks[i];
					console.log(`Creating embedding for chunk ${i+1}/${chunks.length}`);
					
					const embedding = await this.openaiService.createEmbedding(chunk);

					vectorPoints.push({
						id: uuidv4(),
						vector: embedding,
						payload: {
							text: chunk,
							documentId: documentId,
							chunkIndex: i,
							totalChunks: chunks.length,
							metadata: {
								...metadata,
								originalDocument: documentId,
							},
							source,
						},
					});
				}
			} catch (error) {
				console.error(`Error processing document:`, error);
				// Continue with next document instead of failing the entire batch
			}
		}

		return vectorPoints;
	}

	/**
	 * Extract text and metadata from a document
	 *
	 * @param document Document (string path or object with text)
	 * @returns Object with text, metadata, and source
	 */
	protected async extractDocumentContent(document: any): Promise<{ text: string; metadata: any; source: string }> {
		let text: string;
		let metadata = {};
		let source = "unknown";

		try {
			if (typeof document === "string") {
				// Document is a file path
				text = await this.convertFileToText(document);
				source = document;
			} else if (document.text) {
				// Document is an object with text property
				text = document.text;
				metadata = document.metadata || {};
				source = document.source || "unknown";
			} else {
				throw new Error("Invalid document format. Expected a file path or an object with a text property.");
			}

			return { text, metadata, source };
		} catch (error) {
			console.error("Error extracting document content:", error);
			throw error;
		}
	}

	/**
	 * Split text into semantic chunks
	 *
	 * @param text Text to split
	 * @returns Array of semantic chunks
	 */
	protected async splitTextIntoSemanticChunks(text: string): Promise<string[]> {
		try {
			// For very large texts, first do a basic split to avoid token limits
			if (text.length > 10000) {
				console.log("Large text detected, performing initial chunking");
				const initialChunks = this.chunkTextWithOverlap(text, 5000, 0.15);
				
				// Then use AI to split each large chunk into semantic chunks
				const allSemanticChunks: string[] = [];
				
				for (const chunk of initialChunks) {
					const semanticChunks = await this.openaiService.splitTextIntoChunks(chunk);
					allSemanticChunks.push(...semanticChunks);
				}
				
				return allSemanticChunks;
			} else {
				// For smaller texts, directly use AI for semantic chunking
				return await this.openaiService.splitTextIntoChunks(text);
			}
		} catch (error) {
			console.error("Error splitting text into chunks:", error);
			// Fallback to basic chunking if AI chunking fails
			return this.chunkTextWithOverlap(text, 1000, 0.1);
		}
	}

	/**
	 * Split text into chunks with overlap
	 *
	 * @param text Text to split
	 * @param maxTokens Maximum tokens per chunk
	 * @param overlapPercent Percentage of overlap between chunks
	 * @returns Array of text chunks
	 */
	protected chunkTextWithOverlap(text: string, maxTokens: number, overlapPercent: number): string[] {
		const words = text.split(/\s+/);
		const overlapTokens = Math.floor(maxTokens * overlapPercent);
		const chunks = [];

		for (let i = 0; i < words.length; i += maxTokens - overlapTokens) {
			const chunk = words.slice(i, i + maxTokens).join(" ");
			chunks.push(chunk);
		}

		return chunks;
	}

	/**
	 * Convert a file to text based on its type
	 *
	 * @param filePath Path to the file
	 * @returns Extracted text
	 */
	protected async convertFileToText(filePath: string): Promise<string> {
		const ext = filePath.split(".").pop()?.toLowerCase();

		try {
			if (ext === "txt") {
				return fs.promises.readFile(filePath, "utf-8");
			} else if (ext === "pdf") {
				const dataBuffer = fs.readFileSync(filePath);
				const pdfExtract = new PDFExtract();
				const data = await pdfExtract.extractBuffer(dataBuffer);

				// Combine all page content into a single string
				return data.pages.map((page) => page.content.map((item) => item.str).join(" ")).join("\n\n");
			} else if (ext === "docx") {
				const result = await mammoth.extractRawText({ path: filePath });
				return result.value;
			} else if (ext === "md" || ext === "markdown") {
				// Handle markdown files - just read as plain text
				return fs.promises.readFile(filePath, "utf-8");
			} else if (ext === "json") {
				// Handle JSON files
				const jsonContent = await fs.promises.readFile(filePath, "utf-8");
				const parsedJson = JSON.parse(jsonContent);
				// Convert JSON to string representation
				return JSON.stringify(parsedJson, null, 2);
			} else {
				throw new Error(`Unsupported file type: ${ext}`);
			}
		} catch (error) {
			console.error(`Error converting file ${filePath} to text:`, error);
			throw error;
		}
	}

	/**
	 * Check OpenAI API status
	 *
	 * @returns Status information
	 */
	public async checkOpenAIStatus(): Promise<any> {
		try {
			// Create a simple embedding to test the API
			const testEmbedding = await this.openaiService.createEmbedding("Test connection");
			return {
				status: "connected",
				embeddingSize: testEmbedding.length,
				model: "text-embedding-3-small",
			};
		} catch (error: any) {
			return {
				status: "error",
				message: error.message,
			};
		}
	}
}
