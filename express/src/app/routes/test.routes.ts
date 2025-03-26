import { Router } from "express";
import { IRoute } from "../../interfaces/IRouter.js";
import DocumentProcessingService from "../services/DocumentProcessingService.js";

export default class TestRoutes implements IRoute {
  public getRoutes(): Router {
    const router = Router();
    const documentService = new DocumentProcessingService();

    // Simple test endpoint
    router.get("/test-processing", async (req, res) => {
      try {
        const filePath = req.query.filePath as string;
        const collectionName = req.query.collection || "test_collection";
        
        if (!filePath) {
          return res.status(400).json({
            success: false,
            message: "filePath query parameter is required"
          });
        }
        
        const result = await documentService.addDocumentsToCollection(
          collectionName as string,
          [filePath]
        );
        
        return res.json({
          success: true,
          result
        });
      } catch (error) {
        console.error("Test error:", error);
        return res.status(500).json({
          success: false,
          message: error
        });
      }
    });
    
    return router;
  }
} 