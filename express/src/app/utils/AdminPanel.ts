import AdminJS from "adminjs";
import { Express } from "express";
import { expressAuthenticatedRouter } from "../admin/utils/router.js";
import cmsRoutes from "../middleware/CmsRoutes.js";
import { generateAdminJSConfig } from "../admin/index.js";
import { Database, Resource } from "@adminjs/typeorm";
import appEnv from "../../config/app.js";
import "../admin/utils/components.bundler.js";

AdminJS.registerAdapter({ Database, Resource });

export const attachAdminPanel = async (app: Express) => {
	const config = generateAdminJSConfig();
	const adminJS = new AdminJS(config);

	// Add middleware to check if cms routes should be available
	app.use(adminJS.options.rootPath, cmsRoutes);

	const adminRouter = expressAuthenticatedRouter(adminJS);
	app.use(adminJS.options.rootPath, adminRouter);

	app.get("/", (_, res) => res.redirect(adminJS.options.rootPath));
	// Build AdminJs or start in watch mode for development
	// eslint-disable-next-line @typescript-eslint/no-unused-expressions
	appEnv.env === "development" ? adminJS.watch() : adminJS.initialize();
};
