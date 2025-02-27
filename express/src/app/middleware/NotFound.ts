import { Request, Response } from "express";
import ApiResponses from "../utils/ApiResponses.js";

/**
 * Triggers a 404 API response
 *
 * @param req - the error that occurred
 * @param res
 */
export default function notFound(req: Request, res: Response) {
	return ApiResponses.errorResponse(res, "notFound");
}
