import DocumentService from "../app/services/DocumentService.js";
import PointService from "../app/services/PointService.js";
import DocumentProcessingService from "../app/services/DocumentProcessingService.js";
import ProductService  from "../app/services/ProductService.js"; // Or CategoryService if needed
import { CreateDocumentInput, DocumentDTO, } from "../app/dtos/document.dto.js";
import { ApiResponse } from "../app/dtos/api-response.dto.js";
import { CreatePointInput } from "../app/dtos/point.dto.js";
/**
 * Orchestrates the complete workflow for managing document.
 * Includes responsibility for managing pointservice!
 */
class DocumentWorkflowService {
  constructor(
    private documentService?: DocumentService,
    private pointService?: PointService,
    private documentProcessingService?: DocumentProcessingService,
    private productService?: ProductService
  ) {
    this.documentService = documentService || new DocumentService();
    this.pointService = pointService || new PointService();
    this.documentProcessingService = documentProcessingService || new DocumentProcessingService();
    this.productService = productService || new ProductService();
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
      const CreateDocumentDTO: CreateDocumentInput = {
        fileContent: file.buffer,
        fileName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        product_id: referenceId,
        category_id: referenceType === "product" ? undefined : referenceId,
      }
      //Creates document and returns entity
      const document: DocumentDTO = await this.documentService.createDocument(CreateDocumentDTO);
      documents.push(document);
       //Process documents into vector points 
      points = await this.documentProcessingService.CreatePointsForDocument(document);
    }
    //Save documents and points to database
    const createdPoints = await this.pointService.createPoints(points);
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
    const reference = await this.productService.getProductById(referenceId);
    if(!reference){
      return { validateRefMessage: `Cant find ${referenceType} with id ${referenceId}`, validateRefSuccess: false };
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

const documentWorkflowService = new DocumentWorkflowService();