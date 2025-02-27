import dotenv from "dotenv";
import express, { Express } from "express";
import "express-async-errors";
import path from "path";
import cors from "cors";
import compression from "compression";
import helmet from "helmet";
import config from "./config/app.js";
import securityConfig from "./config/security.js";
import registerRoutes from "./app/routes/index.js";
import Logger from "./app/utils/Logger.js";
import { redisConnect } from "./app/utils/Redis.js";
import errorHandler from "./app/middleware/ErrorHandler.js";
import ErrorReporting from "./app/utils/ErrorReporting.js";
import notFound from "./app/middleware/NotFound.js";
import { attachAdminPanel } from "./app/utils/AdminPanel.js";
import { dbConnection } from "./database/typeorm-db.js";
import logtrace from "./app/middleware/LogTrace.js";
import { dirName } from "./app/utils/MiscHelpers.js";
import database from "./config/database.js";

// Auth
// import("./app/middleware/Auth.js");

dotenv.config();

/**
 * Ensure unhandled exceptions/rejections are still reported
 */
process
	.on("unhandledRejection", async (reason) => {
		// Also log to regular console err
		// in case it is the logging driver itself causing issues
		// eslint-disable-next-line no-console
		console.error("unhandledRejection occurred");
		// eslint-disable-next-line no-console
		console.error(reason);

		Logger.info("unhandledRejection occurred");

		ErrorReporting.reportAny(reason);

		// Make process exit as we are likely in invalid state now
		Logger.info("exit proc");

		process.exit(1);
	})
	.on("uncaughtException", async (err) => {
		// Also log to regular console err
		// in case it is the logging driver itself causing issues
		// eslint-disable-next-line no-console
		console.error("uncaughtException occurred");
		// eslint-disable-next-line no-console
		console.error(err);

		Logger.info("uncaughtException occurred");

		// Report the error
		ErrorReporting.report(err);

		// Make process exit as we are likely in invalid state now
		Logger.info("exit proc");

		process.exit(1);
	});

class Server {
	app!: Express;

	port = process.env.SERVER_PORT;

	/**
	 * Setup express server
	 */
	public async init() {
		this.app = express();
		const router = express.Router();

		// Configure Express to use view engine
		this.app.use(express.static(path.join(dirName(import.meta), "../src/public")));
		this.app.set("views", path.join(dirName(import.meta), "views"));
		this.app.set("view engine", config.views.engine);

		// Set modules
		this.app.use(helmet(securityConfig.helmet));
		this.app.use(compression());
		this.app.use(cors(securityConfig.cors));

		// init redis
		if (config.redis.enabled) await redisConnect();

		// init db
		if (database.enabled) await dbConnection();

		// init adminJS
		if (config.adminPanel.enabled) await attachAdminPanel(this.app);

		// Be sure to set bodyparser after admin panel
		this.app.use(express.json()); // to support JSON-encoded bodies
		this.app.use(express.urlencoded({ extended: true })); // to support URL-encoded bodies
		this.app.use(logtrace);

		// Set routes
		registerRoutes(router);
		this.app.use(router);

		// Set fallback handlers
		this.app.use(errorHandler);
		this.app.use(notFound);

		// Run http server
		await this.start();
	}

	/**
	 * Do startup work, and then start the http server
	 */
	async start() {
		// Starts the http server
		this.app.listen(this.port, () => Logger.notice(`server started at ${this.port}`));
	}
}

// Run!
const server = new Server();
server.init();
