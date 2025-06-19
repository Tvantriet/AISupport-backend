export interface CreatePointInput {
    document_id: string;
    embedding: number[];
    content: string;
    index: number;
  }

  export interface PointDTO {
    id: string;
    document_id: string;
    content: string;
    index: number;
    embedding: number[];
  }

  export interface PointDTOWithDistance {
    point: PointDTO;
    distance: number;
  }

  export interface PointOutput {
    documentName: string;
    content: string;
    similarity: number;
  }
