export interface Product {
  id: number;
  name: string;
  description: string;
  imageUrl?: string;
  imageKey?: string; // R2 storage key
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProductInput {
  name: string;
  description: string;
  image?: Buffer; // For file upload
}

export interface UpdateProductInput {
  name?: string;
  description?: string;
  image?: Buffer; // For file upload
} 