export interface Product {
    id: string;
    name: string;
    description: string;
    imageUrl?: string;
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