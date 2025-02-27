import dotenv from "dotenv";
dotenv.config();
import { NextFunction, Request, Response } from "express";
import cls from "../utils/CLS.js";

/**
 * Transforms error into error message which will be send as API response
 *
 * @param req
 * @param res
 * @param next
 */
export default function logTrace(req: Request, res: Response, next: NextFunction) {
	cls.logFields = {
		labels: {},
	};

	const project = process.env.GCP_PROJECT_ID;

	if (project && typeof req !== "undefined") {
		const traceHeader = req.header("X-Cloud-Trace-Context");
		if (traceHeader) {
			const [trace] = traceHeader.split("/");
			cls.logFields["logging.googleapis.com/trace"] = `projects/${project}/traces/${trace}`;
		}
	}

	next();
}
