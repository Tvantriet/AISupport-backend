import apiRoutes from "../middleware/ApiRoutes.js";
import ApiRouter from "./api.js";
import WebRouter from "./web.js";
import ProductRoutes from "./product.routes.js";
import ChatInterfaceRoutes from "./chatInterface.routes.js";
import TestRoutes from "./test.routes.js";
import ContextInspectionRoutes from "./contextInspection.routes.js"

import { Router } from "express";

export default (router: Router) => {
	const webRouter = new WebRouter();
	const apiRouter = new ApiRouter();
	router.use(webRouter.getRoutes());

	router.use(
		"/api",
		// Add middleware to check if cms routes should be available
		apiRoutes,
		apiRouter.getRoutes(),
	);

	console.log("Registering product routes");
	router.use("/api/products", new ProductRoutes().getRoutes());
	
	console.log("Registering chat routes");
	router.use("/api/chat", new ChatInterfaceRoutes().getRoutes());

	console.log("Registering contextinspection routes")
	router.use("/api/context-inspection", new ContextInspectionRoutes().getRoutes())
	
	console.log("Registering test routes");
	router.use("/api/test", new TestRoutes().getRoutes());
	console.log("Test routes registered");
};
