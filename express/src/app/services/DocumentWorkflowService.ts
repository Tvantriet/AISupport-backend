import DocumentService from "./DocumentService.js";
import PointService from "./PointService.js";
import DocumentProcessingService from "./DocumentProcessingService.js";
import ProductService  from "./ProductService.js"; // Or CategoryService if needed
import { CreateDocumentInput, CreatePointsForDocument, DocumentDTO, } from "../dtos/document.dto.js";
import { ApiResponse } from "../dtos/api-response.dto.js";
import { CreatePointInput } from "../dtos/point.dto.js";
import CategoryService from "./CategoryService.js";
import { v4 as uuidv4 } from 'uuid';

/**
 * Orchestrates the complete workflow for managing document.
 * Includes responsibility for managing pointservice!
 */
export default class DocumentWorkflowService {
  constructor(
    private documentService?: DocumentService,
    private pointService?: PointService,
    private documentProcessingService?: DocumentProcessingService,
    private productService?: ProductService,
    private categoryService?: CategoryService
  ) {
    this.documentService = documentService || new DocumentService();
    this.pointService = pointService || new PointService();
    this.documentProcessingService = documentProcessingService || new DocumentProcessingService();
    this.productService = productService || new ProductService();
    this.categoryService = categoryService || new CategoryService();
  }


  /**
   * Adds one or more documents associated with a reference entity (Product/Category).
   * Handles file upload, metadata saving, processing, and point storage atomically per file.
   *
   * @param referenceId ID of the Product or Category.
   * @param referenceType 'product' or 'category'.
   * @param files Array of file objects (e.g., from Multer).
   * @returns Result object summarizing the operation.
   */
  public async addDocuments(
    referenceId: string,
    referenceType: "product" | "category",
    files: Express.Multer.File[] // Use Multer's type or your file structure
  ): Promise<ApiResponse<DocumentDTO[]>> {
    const { validateRefMessage, validateRefSuccess } = await this.validateReference(referenceId, referenceType);
    if(!validateRefSuccess){
      return { success: false, message: validateRefMessage, data: [] };
    }
    const { validateFilesMessage, validateFilesSuccess } = await this.validateFiles(files);
    if(!validateFilesSuccess){
      return { success: false, message: validateFilesMessage, data: [] };
    }
    //Create objects with document metadata
    //create documents 1 by 1
    let points : CreatePointInput[] = [];
    let documents : DocumentDTO[] = [];
    for (const file of files) {
      console.log('file', file);

      const CreateDocumentDTO: CreateDocumentInput = {
        name: file.filename,
        file_type: file.mimetype,
        size: file.size,
        points: 0,
        product_id: referenceType === "product" ? referenceId : undefined,
        category_id: referenceType === "category" ? referenceId : undefined,
      }
      const document: DocumentDTO = await this.documentService.createDocument(CreateDocumentDTO);

      const createPointsForDocument: CreatePointsForDocument = {
        content: file.buffer,
        file_extension: file.originalname.split('.').pop(),
        document_id: document.id,
      }

      points = await this.documentProcessingService.CreatePointsForDocument(createPointsForDocument);
      const createdPoints = await this.pointService.createPoints(points);
      documents.push(document);
    }
    //Save documents and points to database
    return { success: true, message: `Documents added successfully.`, data: documents };
  }

  /**
   * Deletes a specific document, its associated points (via DB cascade),
   *
   * @param documentId The ID of the Document entity to delete.
   * @returns Result object.
   */
  public async deleteDocument(documentId: string): Promise<ApiResponse<boolean>> {
    console.log(`[Workflow] Attempting to delete document: ${documentId}`);
    try {

      const success = await this.documentService.deleteDocument(documentId);
      return { success: true, message: `Document ${documentId} deleted successfully.`, data: success };

    } catch (error: any) {
      console.error(`[Workflow] Error deleting document ${documentId}:`, error);
      return { success: false, message: `Error deleting document: ${error.message}`, data: false };
    }
  }

  private async validateReference(referenceId: string, referenceType: string): Promise<{ validateRefMessage: string, validateRefSuccess: boolean }> {
    let reference;
    if (referenceType === "product") {
      reference = await this.productService.getProductById(referenceId);
    } else if (referenceType === "category") {
      reference = await this.categoryService.getCategoryById(referenceId);
    }

    if (!reference) {
      return { validateRefMessage: `Can't find ${referenceType} with id ${referenceId}`, validateRefSuccess: false };
    }
    return { validateRefMessage: `Reference ${referenceType} with id ${referenceId} found`, validateRefSuccess: true };
  }

  private async validateFiles(files: Express.Multer.File[]): Promise<{ validateFilesMessage: string, validateFilesSuccess: boolean }> {
    if(!files || files.length === 0){
      return { validateFilesMessage: `No files provided`, validateFilesSuccess: false };
    }
    return { validateFilesMessage: `Files provided`, validateFilesSuccess: true };
  }
}