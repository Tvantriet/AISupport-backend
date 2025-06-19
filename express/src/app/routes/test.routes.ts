import { Router } from "express";
import { IRoute } from "../../interfaces/IRouter.js";
import fs from "fs";
import path from "path";
import DocumentProcessingService from "../services/DocumentProcessingService.js";
import ApiResponses from "../utils/ApiResponses.js";
export default class TestRoutes implements IRoute {
  public getRoutes(): Router {
    const router = Router();
    const documentService = new DocumentProcessingService();

    // Test the basic endpoint first to verify routing works
    router.get("/", (req, res) => {
      res.json({ message: "Test routes are working" });
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
    
    return router;
  }
} 