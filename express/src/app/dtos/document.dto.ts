export interface CreateDocumentInput {
    name: string;
    file_type: string;
    size: number;
    points: number;
    product_id?: string;
    category_id?: string;
}

export interface CreatePointsForDocument {
    content: Buffer;
    file_extension: string;
    document_id: string;
}

export interface DocumentDTO {
    id: string;
    name: string;
    size: number;
    points: number;
    file_type: string;
}
