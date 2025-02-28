import { describe, it, expect, beforeEach, vi } from 'vitest';
import DocumentProcessingService from '../app/services/DocumentProcessingService.js';
import MockOpenAIService from './mocks/MockOpenAIService.js';
import MockQdrantService from './mocks/MockQdrantService.js';

// Mock the external dependencies
vi.mock('fs', () => {
    return {
        default: {
            promises: {
                readFile: vi.fn().mockResolvedValue('Mock file content'),
            },
            readFileSync: vi.fn().mockReturnValue(Buffer.from('Mock PDF content')),
        }
    };
});

vi.mock('pdf-parse', () => {
    return {
        default: vi.fn().mockResolvedValue({ text: 'Mock parsed PDF content' }),
    };
});

vi.mock('mammoth', () => {
    return {
        default: {
            extractRawText: vi.fn().mockResolvedValue({ value: 'Mock extracted DOCX content' }),
        }
    };
});

// Create a testable version of DocumentProcessingService that exposes private methods
class TestableDocumentProcessingService extends DocumentProcessingService {
    constructor(openaiService: any, qdrantService: any) {
        super();
        // @ts-ignore - Override private properties for testing
        this.openaiService = openaiService;
        // @ts-ignore - Override private properties for testing
        this.qdrantService = qdrantService;
    }

    // Expose private methods for testing
    public async extractDocumentContent(document: any): Promise<{ text: string, metadata: any, source: string }> {
        return super.extractDocumentContent(document);
    }

    public async splitTextIntoSemanticChunks(text: string): Promise<string[]> {
        return super.splitTextIntoSemanticChunks(text);
    }

    public chunkTextWithOverlap(text: string, maxTokens: number, overlapPercent: number): string[] {
        return super.chunkTextWithOverlap(text, maxTokens, overlapPercent);
    }

    public async convertFileToText(filePath: string): Promise<string> {
        return super.convertFileToText(filePath);
    }

    public async processDocumentsToVectorPoints(documents: any[]): Promise<Array<{ id: string | number; vector: number[]; payload: any }>> {
        return super.processDocumentsToVectorPoints(documents);
    }

    public async createCollectionWithDocuments(collectionName: string, dimension: number, documents: any[]): Promise<any> {
        return super.createCollectionWithDocuments(collectionName, dimension, documents);
    }
}

describe('DocumentProcessingService', () => {
    let service: TestableDocumentProcessingService;
    let mockOpenAIService: MockOpenAIService;
    let mockQdrantService: MockQdrantService;

    beforeEach(() => {
        mockOpenAIService = new MockOpenAIService();
        mockQdrantService = new MockQdrantService();
        service = new TestableDocumentProcessingService(mockOpenAIService, mockQdrantService);
    });

    describe('extractDocumentContent', () => {
        it('should extract content from a file path', async () => {
            const result = await service.extractDocumentContent('test.txt');
            expect(result).toEqual({
                text: 'Mock file content',
                metadata: {},
                source: 'test.txt'
            });
        });

        it('should extract content from a document object', async () => {
            const result = await service.extractDocumentContent({
                text: 'Document text',
                metadata: { author: 'Test Author' },
                source: 'test-source'
            });
            expect(result).toEqual({
                text: 'Document text',
                metadata: { author: 'Test Author' },
                source: 'test-source'
            });
        });

        it('should throw an error for invalid document format', async () => {
            await expect(service.extractDocumentContent({ invalid: 'format' }))
                .rejects.toThrow('Invalid document format');
        });
    });

    describe('convertFileToText', () => {
        it('should convert txt file to text', async () => {
            const result = await service.convertFileToText('test.txt');
            expect(result).toBe('Mock file content');
        });

        it('should convert pdf file to text', async () => {
            const result = await service.convertFileToText('test.pdf');
            expect(result).toBe('Mock parsed PDF content');
        });

        it('should convert docx file to text', async () => {
            const result = await service.convertFileToText('test.docx');
            expect(result).toBe('Mock extracted DOCX content');
        });

        it('should throw an error for unsupported file type', async () => {
            await expect(service.convertFileToText('test.unknown'))
                .rejects.toThrow('Unsupported file type');
        });
    });

    describe('chunkTextWithOverlap', () => {
        it('should split text into chunks with overlap', () => {
            const text = 'word1 word2 word3 word4 word5 word6 word7 word8 word9 word10';
            const result = service.chunkTextWithOverlap(text, 5, 0.2);
            
            // With maxTokens=5 and overlapPercent=0.2, we should have 1 token overlap
            expect(result).toHaveLength(3);
            expect(result[0]).toBe('word1 word2 word3 word4 word5');
            expect(result[1]).toBe('word5 word6 word7 word8 word9');
            expect(result[2]).toBe('word9 word10');
        });
    });

    describe('splitTextIntoSemanticChunks', () => {
        it('should split text into semantic chunks', async () => {
            // Mock the splitTextIntoChunks method
            vi.spyOn(mockOpenAIService, 'splitTextIntoChunks').mockResolvedValue(['Chunk 1', 'Chunk 2']);
            
            const result = await service.splitTextIntoSemanticChunks('Test text to split');
            
            expect(result).toEqual(['Chunk 1', 'Chunk 2']);
            expect(mockOpenAIService.splitTextIntoChunks).toHaveBeenCalled();
        });
    });

    describe('processDocumentsToVectorPoints', () => {
        it('should process multiple documents into vector points', async () => {
            // Mock the necessary methods
            vi.spyOn(service, 'extractDocumentContent').mockResolvedValueOnce({
                text: 'Document 1 text',
                metadata: { doc: 1 },
                source: 'source1'
            }).mockResolvedValueOnce({
                text: 'Document 2 text',
                metadata: { doc: 2 },
                source: 'source2'
            });
            
            vi.spyOn(service, 'splitTextIntoSemanticChunks')
                .mockResolvedValueOnce(['Chunk 1.1', 'Chunk 1.2'])
                .mockResolvedValueOnce(['Chunk 2.1']);
                
            vi.spyOn(mockOpenAIService, 'createEmbedding')
                .mockResolvedValueOnce([0.1, 0.2])
                .mockResolvedValueOnce([0.3, 0.4])
                .mockResolvedValueOnce([0.5, 0.6]);
            
            // Use a fixed ID for testing
            const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.123456789);
            const dateSpy = vi.spyOn(Date, 'now').mockReturnValue(1000000);
            
            const documents = [{ text: 'Doc1' }, { text: 'Doc2' }];
            const result = await service.processDocumentsToVectorPoints(documents);
            
            expect(result).toHaveLength(3);
            expect(result[0].vector).toEqual([0.1, 0.2]);
            expect(result[0].payload.text).toBe('Chunk 1.1');
            expect(result[0].payload.metadata).toEqual({ doc: 1 });
            expect(result[0].payload.source).toBe('source1');
            
            expect(result[1].vector).toEqual([0.3, 0.4]);
            expect(result[1].payload.text).toBe('Chunk 1.2');
            
            expect(result[2].vector).toEqual([0.5, 0.6]);
            expect(result[2].payload.text).toBe('Chunk 2.1');
            expect(result[2].payload.metadata).toEqual({ doc: 2 });
            expect(result[2].payload.source).toBe('source2');
            
            // Restore spies
            randomSpy.mockRestore();
            dateSpy.mockRestore();
        });
    });

    describe('createCollectionWithDocuments', () => {
        it('should create a new collection and add documents', async () => {
            // Mock the necessary methods
            vi.spyOn(mockQdrantService, 'collectionExists').mockResolvedValue(false);
            vi.spyOn(mockQdrantService, 'createCollection').mockResolvedValue(undefined);
            vi.spyOn(service, 'processDocumentsToVectorPoints').mockResolvedValue([
                { id: 'id1', vector: [0.1, 0.2], payload: { text: 'Chunk 1' } },
                { id: 'id2', vector: [0.3, 0.4], payload: { text: 'Chunk 2' } }
            ]);
            vi.spyOn(mockQdrantService, 'addPoints').mockResolvedValue({ status: 'ok' });
            
            const docs = [{ text: 'Doc1' }, { text: 'Doc2' }];
            const result = await service.createCollectionWithDocuments('test-collection', 2, docs);
            
            expect(result).toHaveProperty('success', true);
            expect(result).toHaveProperty('created', true);
            expect(result).toHaveProperty('documentsAdded', 2);
            expect(result).toHaveProperty('chunksCreated', 2);
            
            expect(mockQdrantService.collectionExists).toHaveBeenCalledWith('test-collection');
            expect(mockQdrantService.createCollection).toHaveBeenCalledWith('test-collection', 2);
            expect(service.processDocumentsToVectorPoints).toHaveBeenCalledWith(docs);
            expect(mockQdrantService.addPoints).toHaveBeenCalledWith('test-collection', expect.any(Array));
        });
        
        it('should add documents to an existing collection', async () => {
            // Mock the necessary methods
            vi.spyOn(mockQdrantService, 'collectionExists').mockResolvedValue(true);
            vi.spyOn(mockQdrantService, 'createCollection').mockResolvedValue(undefined);
            vi.spyOn(service, 'processDocumentsToVectorPoints').mockResolvedValue([
                { id: 'id1', vector: [0.1, 0.2], payload: { text: 'Chunk 1' } }
            ]);
            vi.spyOn(mockQdrantService, 'addPoints').mockResolvedValue({ status: 'ok' });
            
            const docs = [{ text: 'New document' }];

            const result = await service.createCollectionWithDocuments('existing-collection', 2, docs);

            expect(result).toHaveProperty('success', true);
            expect(result).toHaveProperty('created', false);
            expect(mockQdrantService.createCollection).not.toHaveBeenCalled();
        });
    });
}); 
