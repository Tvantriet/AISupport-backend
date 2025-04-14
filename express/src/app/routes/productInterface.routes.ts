import { Router } from "express";
import ProductInterfaceController from "../controllers/ProductInterfaceController.js";
import { IRoute } from "../../interfaces/IRouter.js";

export default class ProductInterfaceRoutes implements IRoute {
    public getRoutes(): Router {
        const router = Router();
        const controller = new ProductInterfaceController();

		router.get("/status", controller.checkStatus.bind(controller));
		
		router.patch(
			"/collection/:name",
			controller.validate("editCollection"),
			controller.editCollection.bind(controller),
		);
		router.delete("/collection/:name", controller.deleteCollection.bind(controller));
		
		router.post("/create-empty-collection", async (req, res) => {
			try {
				const { collectionName, dimension = 3072 } = req.body;
				
				if (!collectionName) {
					return res.status(400).json({
						success: false,
						error: "Collection name is required"
					});
				}
				
				const result = await controller.qdrantService.createCollection(
					collectionName,
					dimension
				);
				
				return res.json({
					success: true,
					message: `Empty collection ${collectionName} created successfully`
				});
			} catch (error) {
				console.error("Error creating empty collection:", error);
				return res.status(500).json({
					success: false,
					message: error || "An error occurred"
				});
			}
		});
		
		router.get("/manage", async (req, res) => {
			res.send(`
				<!DOCTYPE html>
				<html>
				<head>
					<title>Qdrant Collections Manager</title>
					<style>
						body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
						h1, h2 { color: #333; }
						.container { max-width: 800px; margin: 0 auto; }
						.section { margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 4px; }
						.form-group { margin-bottom: 10px; }
						label { display: block; margin-bottom: 5px; }
						input, select, textarea { width: 100%; padding: 8px; box-sizing: border-box; }
						button { background-color: #4CAF50; color: white; padding: 8px 12px; border: none; cursor: pointer; margin-right: 5px; }
						button:hover { background-color: #45a049; }
						.delete-btn { background-color: #f44336; }
						pre { background-color: #f5f5f5; padding: 10px; overflow: auto; }
						textarea { height: 150px; }
					</style>
				</head>
				<body>
					<div class="container">
						<h1>Qdrant Collections Manager</h1>
						
						<div class="section">
							<h2>Collections List</h2>
							<button id="refresh-btn">Refresh List</button>
							<pre id="collections-result">Loading...</pre>
						</div>
						
						<div class="section">
							<h2>1. Create Empty Collection</h2>
							<p>First, create an empty collection:</p>
							<div class="form-group">
								<label for="collection-name">Collection Name:</label>
								<input type="text" id="collection-name" placeholder="Enter collection name">
							</div>
							<div class="form-group">
								<label for="dimension">Vector Dimension:</label>
								<input type="number" id="dimension" value="3072">
							</div>
							<button id="create-btn">Create Empty Collection</button>
							<pre id="create-result"></pre>
						</div>
						
						<div class="section">
							<h2>2. Add Documents to Collection</h2>
							<p>Then, add documents to an existing collection:</p>
							<div class="form-group">
								<label for="docs-collection-name">Collection Name:</label>
								<select id="docs-collection-name">
									<option value="">Select a collection</option>
								</select>
							</div>
							<div class="form-group">
								<label for="documents">Documents (JSON array):</label>
								<textarea id="documents" placeholder='[
  {
    "text": "This is a sample document.",
    "metadata": {
      "source": "manual entry",
      "id": "doc1"
    }
  }
]'></textarea>
							</div>
							<button id="add-docs-btn">Add Documents</button>
							<pre id="add-docs-result"></pre>
						</div>
						
						<div class="section">
							<h2>Delete Collection</h2>
							<div class="form-group">
								<label for="delete-collection-name">Collection Name:</label>
								<select id="delete-collection-name">
									<option value="">Select a collection</option>
								</select>
							</div>
							<button id="delete-btn" class="delete-btn">Delete Collection</button>
							<pre id="delete-result"></pre>
						</div>
					</div>
					
					<script>
						document.addEventListener('DOMContentLoaded', () => {
							listCollections();
						});
						
						document.getElementById('refresh-btn').addEventListener('click', listCollections);
						document.getElementById('create-btn').addEventListener('click', createEmptyCollection);
						document.getElementById('add-docs-btn').addEventListener('click', addDocuments);
						document.getElementById('delete-btn').addEventListener('click', deleteCollection);
						
						async function listCollections() {
							try {
								const response = await fetch('/api/status');
								const data = await response.json();
								
								document.getElementById('collections-result').textContent = 
									JSON.stringify(data.qdrant, null, 2);
								
								console.log('Collections data:', data.qdrant);
								
								let collectionsArray = [];
								if (data.qdrant && data.qdrant.collections) {
									if (Array.isArray(data.qdrant.collections)) {
										collectionsArray = data.qdrant.collections;
									} else if (typeof data.qdrant.collections === 'number') {
										const collectionsResponse = await fetch('/api/products/collections-list');
										const collectionsData = await collectionsResponse.json();
										if (Array.isArray(collectionsData.collections)) {
											collectionsArray = collectionsData.collections;
										}
									}
								}
								
								updateCollectionDropdowns(collectionsArray);
							} catch (error) {
								console.error('Error fetching collections:', error);
								document.getElementById('collections-result').textContent = 
									'Error: ' + error.message;
							}
						}
						
						function updateCollectionDropdowns(collections) {
							if (!Array.isArray(collections)) {
								console.error('Collections is not an array:', collections);
								collections = [];
							}
							
							const dropdowns = [
								document.getElementById('docs-collection-name'),
								document.getElementById('delete-collection-name')
							];
							
							dropdowns.forEach(dropdown => {
								const currentSelection = dropdown.value;
								
								dropdown.innerHTML = '<option value="">Select a collection</option>';
								
								collections.forEach(collection => {
									const option = document.createElement('option');
									option.value = collection.name;
									option.textContent = collection.name;
									dropdown.appendChild(option);
								});
								
								if (currentSelection) {
									dropdown.value = currentSelection;
								}
							});
						}
						
						async function createEmptyCollection() {
							const collectionName = document.getElementById('collection-name').value.trim();
							const dimension = parseInt(document.getElementById('dimension').value);
							
							if (!collectionName) {
								document.getElementById('create-result').textContent = 'Error: Collection name is required';
								return;
							}
							
							try {
								const response = await fetch('/api/products/empty-collection', {
									method: 'POST',
									headers: {
										'Content-Type': 'application/json'
									},
									body: JSON.stringify({
										collectionName,
										dimension
									})
								});
								
								const result = await response.json();
								document.getElementById('create-result').textContent = JSON.stringify(result, null, 2);
								
								await listCollections();
							} catch (error) {
								document.getElementById('create-result').textContent = 'Error: ' + error.message;
							}
						}
						
						async function addDocuments() {
							const collectionName = document.getElementById('docs-collection-name').value;
							const documentsText = document.getElementById('documents').value;
							
							if (!collectionName) {
								document.getElementById('add-docs-result').textContent = 'Error: Please select a collection';
								return;
							}
							
							let documents;
							try {
								documents = JSON.parse(documentsText);
							} catch (error) {
								document.getElementById('add-docs-result').textContent = 'Error: Invalid JSON: ' + error.message;
								return;
							}
							
							try {
								const response = await fetch('/api/products/documents', {
									method: 'POST',
									headers: {
										'Content-Type': 'application/json'
									},
									body: JSON.stringify({
										collectionName,
										documents
									})
								});
								
								const result = await response.json();
								document.getElementById('add-docs-result').textContent = JSON.stringify(result, null, 2);
							} catch (error) {
								document.getElementById('add-docs-result').textContent = 'Error: ' + error.message;
							}
						}
						
						async function deleteCollection() {
							const collectionName = document.getElementById('delete-collection-name').value;
							
							if (!collectionName) {
								document.getElementById('delete-result').textContent = 'Error: Please select a collection';
								return;
							}
							
							if (!confirm('Are you sure you want to delete collection: ' + collectionName + '?')) {
								return;
							}
							
							try {
								const response = await fetch('/api/products/collection/' + collectionName, {
									method: 'DELETE'
								});
								
								const result = await response.json();
								document.getElementById('delete-result').textContent = JSON.stringify(result, null, 2);
								
								await listCollections();
							} catch (error) {
								document.getElementById('delete-result').textContent = 'Error: ' + error.message;
							}
						}
					</script>
				</body>
				</html>
			`);
		});
		
		router.post(
			"/empty-collection",
			controller.createEmptyCollection.bind(controller)
		);
		
		router.post(
			"/documents",
			controller.addDocumentsToCollection.bind(controller)
		);
		
		router.get("/collections-list", async (req, res) => {
			try {
				const collections = await controller.qdrantService.getCollections();
				return res.json({
					success: true,
					collections: collections.collections
				});
			} catch (error) {
				console.error("Error getting collections:", error);
				return res.status(500).json({
					success: false,
					message: error || "An error occurred"
				});
			}
		});

        return router;
    }
} 
