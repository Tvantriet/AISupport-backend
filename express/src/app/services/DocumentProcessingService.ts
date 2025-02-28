import OpenAIService from "./OpenAIService.js";
import QdrantService from "./QdrantService.js";
import fs from 'fs';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';

export default class DocumentProcessingService {
    private openaiService: OpenAIService;
    private qdrantService: QdrantService;

    constructor() {
        this.openaiService = new OpenAIService();
        this.qdrantService = new QdrantService();
    }

    /**
     * Create a collection and add documents to it
     * 
     * @param collectionName Name of the collection
     * @param dimension Vector dimension
     * @param documents Documents to process and add
     * @returns Result object with status and counts
     */
    public async createCollectionWithDocuments(collectionName: string, dimension: number, documents: any[]): Promise<any> {
        // Step 1: Ensure collection exists
        const exists = await this.qdrantService.collectionExists(collectionName);
        if (!exists) {
            await this.qdrantService.createCollection(collectionName, dimension);
        }
        
        // Step 2: Process all documents into vector points
        const points = await this.processDocumentsToVectorPoints(documents);
        
        // Step 3: Add points to the collection
        const results = await this.qdrantService.addPoints(collectionName, points);
        
        // Step 4: Return results
        return {
            success: true,
            created: !exists,
            documentsAdded: documents.length,
            chunksCreated: points.length,
            results
        };
    }

    /**
     * Process documents into vector points for Qdrant
     * 
     * @param documents Array of documents to process
     * @returns Array of points with id, vector, and payload
     */
    protected async processDocumentsToVectorPoints(documents: any[]): Promise<Array<{ id: string | number; vector: number[]; payload: any }>> {
        const vectorPoints = [];
        
        for (const document of documents) {
            // Step 1: Extract text and metadata from document
            const { text, metadata, source } = await this.extractDocumentContent(document);
            
            // Generate a unique document ID if not provided
            const documentId = document.id || `doc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
            
            // Step 2: Split text into semantic chunks
            const chunks = await this.splitTextIntoSemanticChunks(text);
            
            // Step 3: Create embeddings for each chunk and format as vector points
            for (const chunk of chunks) {
                const embedding = await this.openaiService.createEmbedding(chunk);
                
                vectorPoints.push({
                    id: `chunk_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
                    vector: embedding,
                    payload: { 
                        text: chunk,
                        documentId: documentId,  // Add document ID to payload
                        metadata,
                        source
                    }
                });
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
    protected async extractDocumentContent(document: any): Promise<{ text: string, metadata: any, source: string }> {
        let text: string;
        let metadata = {};
        let source = "unknown";
        
        if (typeof document === 'string') {
            // Document is a file path
            text = await this.convertFileToText(document);
            source = document;
        } else if (document.text) {
            // Document is an object with text property
            text = document.text;
            metadata = document.metadata || {};
            source = document.source || "unknown";
        } else {
            throw new Error('Invalid document format. Expected a file path or an object with a text property.');
        }
        
        return { text, metadata, source };
    }

    /**
     * Split text into semantic chunks
     * 
     * @param text Text to split
     * @returns Array of semantic chunks
     */
    protected async splitTextIntoSemanticChunks(text: string): Promise<string[]> {
        // First split into larger chunks to handle very large documents
        const initialChunks = this.chunkTextWithOverlap(text, 5000, 0.15);
        
        // Then use AI to split into semantic chunks
        const allSemanticChunks: string[] = [];
        
        for (const chunk of initialChunks) {
            const semanticChunks = await this.openaiService.splitTextIntoChunks(chunk);
            allSemanticChunks.push(...semanticChunks);
        }
        
        return allSemanticChunks;
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
            const chunk = words.slice(i, i + maxTokens).join(' ');
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
        const ext = filePath.split('.').pop();

        if (ext === 'txt') {
            return fs.promises.readFile(filePath, 'utf-8');
        } else if (ext === 'pdf') {
            const dataBuffer = fs.readFileSync(filePath);
            const pdfData = await pdfParse(dataBuffer);
            return pdfData.text;
        } else if (ext === 'docx') {
            const result = await mammoth.extractRawText({ path: filePath });
            return result.value;
        } else {
            throw new Error('Unsupported file type');
        }
    }
} 