import { NextFunction, Request, Response } from "express";
import ApiResponses from "../utils/ApiResponses.js";
import lodash from "lodash";
import ErrorReporting from "../utils/ErrorReporting.js";

/**
 * Transforms error into error message which will be send as API response
 *
 * @param err - the error that occurred
 * @param req
 * @param res
 * @param next
 */
export default function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
	const errorCode = err.name ? err.name : lodash.toString(err);

	ErrorReporting.report(err, req);

	if (res.headersSent) return next(err);

	return ApiResponses.errorResponse(res, "serverError", { errorCode });
}
