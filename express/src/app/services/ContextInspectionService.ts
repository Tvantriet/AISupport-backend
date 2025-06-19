import DocumentService from "./DocumentService.js";
import ProductService from "./ProductService.js";
import CategoryService from "./CategoryService.js";
import PointService from "./PointService.js"; // Assuming you'll need this for relevance
import ChatService from "./ChatService.js";
import { ChatResponse } from "./ChatService.js";
import { Product as ProductDTO } from "../dtos/product.dto.js"; // Corrected: Product is the DTO export
import { DocumentDTO } from "../dtos/document.dto.js";
import { CategoryDTO } from "../dtos/category.dto.js";
import { PointDTOWithDistance, PointOutput } from "../dtos/point.dto.js";
import { EmbeddingProvider } from "../interfaces/EmbeddingProvider.js";
import OpenAIEmbeddingService from "./OpenAIEmbeddingService.js";

// Define clear interfaces for the return types of service methods
export interface AvailableContext {
  product: ProductDTO | null;
  productDocuments: DocumentDTO[];
  categories: Array<{
    category: CategoryDTO | null;
    documents: DocumentDTO[];
  }>;
}

export interface DocumentContext{
    parentName: string;
    document: DocumentDTO;
}

export interface ChatResponseWithContext{
    ChatResponse: ChatResponse;
    fullContext: Array<{ role: string; content: string }>;
    points: PointOutput[];
  }

export default class ContextInspectionService {
  private documentService: DocumentService;
  private productService: ProductService;
  private categoryService: CategoryService;
  private pointService: PointService;
  private embeddingProvider: EmbeddingProvider;
  private chatService: ChatService;

  constructor(
    documentService?: DocumentService,
    productService?: ProductService,
    categoryService?: CategoryService,
    pointService?: PointService,
    chatService?: ChatService,
    embeddingProvider?: EmbeddingProvider,
  ) {
    this.documentService = documentService || new DocumentService();
    this.productService = productService || new ProductService();
    this.categoryService = categoryService || new CategoryService();
    this.pointService = pointService || new PointService();
    this.embeddingProvider = embeddingProvider || new OpenAIEmbeddingService();
    this.chatService = chatService || new ChatService();
  }

  /**
   * For a given chat session, this would retrieve the specific context points
   * (e.g., document chunks) that were actually used to generate the AI's responses.
   * This helps in understanding what information the chatbot relied on.
   *
   * @param productId - The identifier for the product.
   */
  async getAllDocuments(productId: string): Promise<DocumentContext[]> {
    const product = await this.productService.getProductById(productId);
    if (!product) {
      // Consider a more specific error type or logging if appropriate
      throw new Error(`Product with ID ${productId} not found`);
    }

    const documentContext: DocumentContext[] = [];

    // Fetch documents directly associated with the product
    const productDocuments = await this.documentService.getDocumentsByParentId(productId);
    documentContext.push(...productDocuments.map(document => ({
      parentName: product.name,
      document: document
    })));

    // Fetch category IDs associated with the product
    const categoryIds = await this.productService.getCategoryIds(productId);

    if (categoryIds && categoryIds.length > 0) {
      // Batch fetch all relevant categories and their documents
      const categoriesWithDocs = await this.categoryService.getCategoriesWithDocumentsByIds(categoryIds);

      for (const category of categoriesWithDocs) {
        // Ensure the category and its documents array exist and documents are loaded
        // The repository should ensure 'documents' is an array, even if empty.
        if (category && category.documents && category.documents.length > 0) {
          documentContext.push(...category.documents.map(document => ({
            parentName: category.name,
            document: document
          })));
        }
      }
    }

    return documentContext;
  }

  /**
   * Tab 3: Get Context Relevance
   * Given a product and a user query, this would calculate and show the relevance
   * scores of various available context points to that query.
   * This helps in debugging why certain information is or isn't being surfaced.
   *
   * @param productId - The identifier for the product.
   * @param query - The user query to check relevance against.
   */
  async getCompletionWithContext(query: string, productId: string, conversationHistory: any[] = []): Promise<ChatResponseWithContext> {
    const queryEmbedding = await this.embeddingProvider.createEmbedding(query);

    const productPromise: Promise<ProductDTO> = this.productService.getProductById(productId);
    const categoryIds : string[] = await this.productService.getCategoryIds(productId);
    const searchResults = await this.pointService.findNearestNeighbors(productId, categoryIds, queryEmbedding, 10);
    const product: ProductDTO = await productPromise;

    const messages = await this.chatService.formatFullContext(searchResults, conversationHistory, query, product);

    const completion = await this.chatService.CreateCompletion(messages, []);
    const points = await this.formatPointData(searchResults);

    const chatResponse: ChatResponse = {
      success: true,
      response: completion.content,
      toolCalls: null //TODO: Add tool calls
    };

    return {
      ChatResponse: chatResponse,
      fullContext: messages,
      points: points
    };
  }

  async formatPointData(points: PointDTOWithDistance[]): Promise<PointOutput[]>{
    return await Promise.all(points.map(async point => ({
      content: point.point.content,
      similarity: point.distance,
      documentName: (await this.documentService.getDocumentById(point.point.document_id)).name,
    })));

  }
}