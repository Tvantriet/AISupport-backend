import { Router } from "express";
import ProductInterfaceController from "../controllers/ProductInterfaceController.js";
import { IRoute } from "../../interfaces/IRouter.js";

export default class ProductInterfaceRoutes implements IRoute {
    public getRoutes(): Router {
        const router = Router();
        const controller = new ProductInterfaceController();

        router.post("/collection", 
            controller.validate("createCollectionWithDocuments"), 
            controller.createCollectionWithDocuments.bind(controller)
        );
        router.patch("/collection/:name", 
            controller.validate("editCollection"), 
            controller.editCollection.bind(controller)
        );
        router.delete("/collection/:name", 
            controller.deleteCollection.bind(controller)
        );
        router.post("/search", 
            controller.searchDocuments.bind(controller)
        );

        return router;
    }
} 