import { DocumentRepository } from "../repositories/DocumentRepository.js"; // Assuming you have this
import { Document } from "../models/Document.entity.js";
import { CreateDocumentInput, DocumentDTO } from "../dtos/document.dto.js"; // Assuming DTO definition

/**
 * Service responsible for managing Document entity metadata and
 * coordinating with the FileStorageProvider.
 * Does NOT handle Point data or document content processing.
 */
export default class DocumentService {
  private repository: DocumentRepository; // Use specific repository if defined

  constructor(
    documentRepository?: DocumentRepository
  ) {
    this.repository = documentRepository || new DocumentRepository();
  }

  /**
   * Creates a new Document metadata record in the database.
   * File doesn't get uploaded to the system at this point.
   *
   * @param documentData Partial data for the Document entity (name, file_key, product_id, etc.).
   * @param entityManager Optional transactional EntityManager.
   * @returns The saved Document entity.
   */
  async createDocument(
    documentData: CreateDocumentInput,
  ): Promise<DocumentDTO> {

    const document = await this.repository.create(documentData);
    console.log(`[DocumentService] Created document metadata record: ${document.id}`);
    return await this.toDTO(document);
  }

  //get all by product or category id
  async getDocumentsByParentId(
    parentId: string,
  ): Promise<DocumentDTO[]> {
    const documents = await this.repository.findByParentId(parentId);
    return await Promise.all(documents.map(document => this.toDTO(document)));
  }

  /**
   * Deletes a Document metadata record from the database.
   * Assumes the associated file in storage is handled elsewhere (e.g., by orchestrator).
   *
   * @param id The UUID of the document to delete.
   * @returns True if a record was deleted, false otherwise.
   */
  async deleteDocument(
    id: string,
  ): Promise<boolean> {

    console.log(`[DocumentService] Attempting to delete document metadata record: ${id}`);
    const deleteResult = await this.repository.delete(id);

    if (deleteResult === false) {
      console.warn(`[DocumentService] Delete operation affected 0 rows for document ID: ${id}. Might have already been deleted.`);
      return false;
    }

    console.log(`[DocumentService] Successfully deleted document metadata record: ${id}`);
    return true;
  }

  async updateDocument(id: string, document: Document): Promise<Document | null> {
    return this.repository.update(id, document);
  }

  async getDocumentById(id: string): Promise<DocumentDTO | null> {
    const document = await this.repository.findById(id);
    if (!document) {
      return null;
    }
    return this.toDTO(document);
  }

  async getDocumentsByIds(ids: string[]): Promise<DocumentDTO[]> {
    if (!ids || ids.length === 0) {
      return [];
    }
    // This method (e.g., findByIds) needs to exist on DocumentRepository
    const documents = await this.repository.findByIds(ids);
    return Promise.all(documents.map(document => this.toDTO(document)));
  }

  private async toDTO(document: Document): Promise<DocumentDTO> {
    const dto: DocumentDTO = {
    id: document.id,
    name: document.name,
    size: document.size,
    points: document.points,
    file_type: document.file_type
    };
    return dto;
  }
}
