import { Router } from 'express';
import ProductController from '../controllers/ProductController.js';
import { IRoute } from "../../interfaces/IRouter.js";

export default class ProductRoutes implements IRoute {
  private router: Router;
  private productController: ProductController;
  
  constructor() {
    this.router = Router();
    this.productController = new ProductController();
    this.setupRoutes();
  }
  
  private setupRoutes() {
    // ===== CRUD Product Routes =====
    
    // Search endpoint (must come before /:id to avoid conflicts)
    this.router.get('/search', this.productController.searchProducts.bind(this.productController));
    
    // GET all products
    this.router.get('/', this.productController.getAllProducts.bind(this.productController));
    
    // GET product by ID
    this.router.get('/:id', this.productController.getProductById.bind(this.productController));
    
    // POST create product (with image upload)
    this.router.post(
      '/',
      this.productController.getImageUploadMiddleware(),
      this.productController.createProduct.bind(this.productController)
    );
    
    // PUT update product (with image upload)
    this.router.put(
      '/:id',
      this.productController.getImageUploadMiddleware(),
      this.productController.updateProduct.bind(this.productController)
    );
    
    // DELETE product
    this.router.delete('/:id', this.productController.deleteProduct.bind(this.productController));
    
    // Add documents to product's vector storage
    this.router.post(
      '/:id/documents',
      this.productController.addDocuments.bind(this.productController)
    );
    
    // New route for batch processing ticket data
    this.router.post(
      '/batch-process-tickets',
      this.productController.getBatchFileUploadMiddleware(),
      this.productController.processBatchImport.bind(this.productController)
    );
    
    // Collection manager UI
    this.router.get('/manage', async (req, res) => {
      res.send(`<!DOCTYPE html><html><head><title>Product Collections Manager</title><style>body{font-family:Arial,sans-serif;margin:0;padding:20px}h1,h2{color:#333}.container{max-width:800px;margin:0 auto}.section{margin-bottom:20px;padding:15px;border:1px solid #ddd;border-radius:4px}.form-group{margin-bottom:10px}label{display:block;margin-bottom:5px}input[type=text],input[type=number],textarea{width:100%;padding:8px;margin-bottom:10px;border:1px solid #ddd;border-radius:4px}button{background:#4CAF50;color:white;padding:10px 15px;border:none;border-radius:4px;cursor:pointer}button:hover{background:#45a049}pre{background:#f5f5f5;padding:10px;border-radius:4px;overflow-x:auto}</style></head><body><div class="container"><h1>Product Collections Manager</h1><div class="section"><h2>Create Empty Collection</h2><div class="form-group"><label for="collectionName">Collection Name:</label><input type="text" id="collectionName" placeholder="Enter collection name"></div><div class="form-group"><label for="dimension">Vector Dimension:</label><input type="number" id="dimension" value="3072"></div><button onclick="createCollection()">Create Collection</button><pre id="create-result"></pre></div><div class="section"><h2>Add Documents</h2><div class="form-group"><label for="docs-collection-name">Collection Name:</label><input type="text" id="docs-collection-name" placeholder="Enter collection name"></div><div class="form-group"><label for="documents">Documents (JSON array):</label><textarea id="documents" rows="10" placeholder="Enter documents JSON"></textarea></div><button onclick="addDocuments()">Add Documents</button><pre id="add-docs-result"></pre></div><div class="section"><h2>Delete Collection</h2><div class="form-group"><label for="delete-collection-name">Collection Name:</label><input type="text" id="delete-collection-name" placeholder="Enter collection name"></div><button onclick="deleteCollection()">Delete Collection</button><pre id="delete-result"></pre></div><div class="section"><h2>Collections List</h2><pre id="collections-list"></pre></div></div><script>async function listCollections(){try{const response=await fetch('/api/products/collections-list');const result=await response.json();document.getElementById('collections-list').textContent=JSON.stringify(result,null,2)}catch(error){document.getElementById('collections-list').textContent='Error: '+error.message}}async function createCollection(){const collectionName=document.getElementById('collectionName').value;const dimension=parseInt(document.getElementById('dimension').value);if(!collectionName){document.getElementById('create-result').textContent='Error: Collection name is required';return}try{const response=await fetch('/api/products/create-empty-collection',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({collectionName,dimension})});const result=await response.json();document.getElementById('create-result').textContent=JSON.stringify(result,null,2);await listCollections()}catch(error){document.getElementById('create-result').textContent='Error: '+error.message}}async function addDocuments(){const collectionName=document.getElementById('docs-collection-name').value;const documentsText=document.getElementById('documents').value;if(!collectionName){document.getElementById('add-docs-result').textContent='Error: Please select a collection';return}let documents;try{documents=JSON.parse(documentsText)}catch(error){document.getElementById('add-docs-result').textContent='Error: Invalid JSON: '+error.message;return}try{const response=await fetch('/api/products/documents',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({collectionName,documents})});const result=await response.json();document.getElementById('add-docs-result').textContent=JSON.stringify(result,null,2)}catch(error){document.getElementById('add-docs-result').textContent='Error: '+error.message}}async function deleteCollection(){const collectionName=document.getElementById('delete-collection-name').value;if(!collectionName){document.getElementById('delete-result').textContent='Error: Please select a collection';return}if(!confirm('Are you sure you want to delete collection: '+collectionName+'?')){return}try{const response=await fetch('/api/products/collection/'+collectionName,{method:'DELETE'});const result=await response.json();document.getElementById('delete-result').textContent=JSON.stringify(result,null,2);await listCollections()}catch(error){document.getElementById('delete-result').textContent='Error: '+error.message}}</script></body></html>`);
    });
  }
  
  public getRoutes(): Router {
    return this.router;
  }
} 