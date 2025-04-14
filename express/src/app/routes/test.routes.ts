import { Router } from "express";
import { IRoute } from "../../interfaces/IRouter.js";
import fs from "fs";
import path from "path";
import DocumentProcessingService from "../services/DocumentProcessingService.js";
import ApiResponses from "../utils/ApiResponses.js";
import PostgresService from "../services/PostgresService.js";

export default class TestRoutes implements IRoute {
  public getRoutes(): Router {
    const router = Router();
    const documentService = new DocumentProcessingService();

    // Test the basic endpoint first to verify routing works
    router.get("/", (req, res) => {
      res.json({ message: "Test routes are working" });
    });

    // Process all files in test_data_tmp folder
    router.post("/process-test-files", async (req, res) => {
      try {
        const { collectionName } = req.body;
        
        if (!collectionName) {
          return res.status(400).json({
            success: false,
            error: "Collection name is required"
          });
        }
        
        const testDataDir = path.join(process.cwd(), "src", "public", "test_data_tmp");
        console.log("Reading files from:", testDataDir);
        
        // Check if directory exists
        if (!fs.existsSync(testDataDir)) {
          return res.status(404).json({
            success: false,
            error: `Directory ${testDataDir} not found`
          });
        }
        
        // Read all files from directory
        const files = fs.readdirSync(testDataDir);
        const filePaths = files.map(file => path.join(testDataDir, file));
        
        console.log(`Found ${filePaths.length} files to process in ${testDataDir}`);
        
        // Check if collection exists, create if it doesn't
        const collectionExists = await documentService.qdrantService.collectionExists(collectionName);
        
        if (!collectionExists) {
          console.log(`Creating new collection: ${collectionName}`);
          await documentService.qdrantService.createCollection(collectionName, 3072); // Using standard embedding size
        }
        
        // Process files
        const result = await documentService.addDocumentsToCollection(collectionName, filePaths);
        
        return res.json({
          success: true,
          files: filePaths,
          result
        });
      } catch (error: any) {
        console.error("Error processing test files:", error);
        return res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });
    
    // List all files in test_data_tmp folder
    router.get("/list-test-files", (req, res) => {
      try {
        const testDataDir = path.join(process.cwd(), "src", "public", "test_data_tmp");
        console.log("TestRoutes - Reading files from:", testDataDir);
        
        // Check if directory exists
        if (!fs.existsSync(testDataDir)) {
          console.log(`Directory not found: ${testDataDir}`);
          return res.status(404).json({
            success: false,
            error: `Directory ${testDataDir} not found`
          });
        }
        
        // Read all files from directory
        const files = fs.readdirSync(testDataDir);
        console.log(`Found ${files.length} files`);
        
        const fileDetails = files.map(file => {
          const filePath = path.join(testDataDir, file);
          const stats = fs.statSync(filePath);
          return {
            name: file,
            path: filePath,
            size: stats.size,
            created: stats.birthtime
          };
        });
        
        return res.json({
          success: true,
          files: fileDetails
        });
      } catch (error: any) {
        console.error("Error listing test files:", error);
        return res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });

    // Add a simple test page with file upload and processing
    router.get("/document-processor", (req, res) => {
      res.send(`
        <html>
        <head>
          <title>Document Processor Test</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
            .container { max-width: 800px; margin: 0 auto; }
            .card { border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin-bottom: 20px; }
            h1, h2 { color: #333; }
            button, input[type="submit"] { background: #4CAF50; color: white; border: none; padding: 10px 15px; border-radius: 4px; cursor: pointer; }
            button:hover, input[type="submit"]:hover { background: #45a049; }
            input[type="text"] { padding: 8px; width: 300px; margin-right: 10px; }
            pre { background: #f5f5f5; padding: 15px; border-radius: 4px; overflow: auto; }
            .file-list { margin-top: 20px; }
            .file-item { margin-bottom: 8px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Document Processor Test Page</h1>
            
            <div class="card">
              <h2>Process Files from test_data_tmp</h2>
              <form id="processForm">
                <label for="collectionName">Collection Name:</label>
                <input type="text" id="collectionName" value="default" required>
                <button type="submit">Process All Files</button>
              </form>
              <div id="processResult"></div>
            </div>
            
            <div class="card">
              <h2>Files in test_data_tmp</h2>
              <button id="refreshFiles">Refresh File List</button>
              <div id="fileList" class="file-list"></div>
            </div>
            
            <script>
              // Load file list on page load
              document.addEventListener('DOMContentLoaded', loadFileList);
              
              // Setup form submission
              document.getElementById('processForm').addEventListener('submit', async function(e) {
                e.preventDefault();
                const collectionName = document.getElementById('collectionName').value;
                const resultDiv = document.getElementById('processResult');
                
                resultDiv.innerHTML = '<p>Processing files... This may take a while.</p>';
                
                try {
                  const response = await fetch('/api/test/process-test-files', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ collectionName })
                  });
                  
                  const result = await response.json();
                  resultDiv.innerHTML = '<h3>Processing Result:</h3><pre>' + JSON.stringify(result, null, 2) + '</pre>';
                } catch (error) {
                  resultDiv.innerHTML = '<p>Error: ' + error.message + '</p>';
                }
              });
              
              // Refresh file list
              document.getElementById('refreshFiles').addEventListener('click', loadFileList);
              
              // Function to load file list
              async function loadFileList() {
                const fileListDiv = document.getElementById('fileList');
                fileListDiv.innerHTML = '<p>Loading files...</p>';
                
                try {
                  const response = await fetch('/api/test/list-test-files');
                  const result = await response.json();
                  
                  if (result.success && result.files.length > 0) {
                    let fileHtml = '<ul>';
                    result.files.forEach(file => {
                      const sizeInKB = Math.round(file.size / 1024);
                      fileHtml += '<li class="file-item">' + file.name + ' (' + sizeInKB + ' KB)</li>';
                    });
                    fileHtml += '</ul>';
                    fileListDiv.innerHTML = fileHtml;
                  } else {
                    fileListDiv.innerHTML = '<p>No files found in test_data_tmp folder.</p>';
                  }
                } catch (error) {
                  fileListDiv.innerHTML = '<p>Error loading files: ' + error.message + '</p>';
                }
              }
            </script>
          </div>
        </body>
        </html>
      `);
    });
    
    // Add a route to check database connection
    router.get('/db-connection', async (req, res) => {
      try {
        const db = new PostgresService();
        await db.connect();
        res.json({ success: true, message: 'Database connection successful' });
      } catch (error) {
        console.error('Database connection error:', error);
        res.status(500).json({ 
          success: false, 
          message: 'Database connection failed',
          error: error
        });
      }
    });
    
    return router;
  }
} 