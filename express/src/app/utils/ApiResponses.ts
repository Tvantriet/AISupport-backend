import errorcodes from "../../config/errorcodes.js";
import lodash from "lodash";
import { Response } from "express";

// Definieer een type voor alle foutcodes
type ErrorCode = keyof typeof errorcodes;

type ErrorExtraData = {
	message?: string;
	[key: string]: any;
};

export default class ApiResponses {
	/**
	 * Generate a response
	 *
	 * @param res
	 * @param data
	 * @param status
	 * @return JsonResponse
	 */
	public static response(res: Response, data: Record<string, any> | Array<Record<string, any>> = {}, status = 200) {
		res.status(status).json(data);
	}

	/**
	 * Generate an error response with a code that looks for a corresponding message.
	 *
	 * @param res
	 * @param code
	 * @param status
	 * @param extraData
	 * @return JsonResponse
	 */
	public static errorResponse<T extends ErrorCode>(
		res: Response,
		code: T,
		extraData: ErrorExtraData = {},
		status?: number,
	) {
		const errorObj = errorcodes[code] ?? errorcodes.serverError;
		let data: any = {};

		// Prepare errorMessage
		data.message = errorObj.message;
		data.code = errorObj.errorCode;

		if (!lodash.isEmpty(extraData)) {
			if (lodash.isArray(extraData)) {
				data.errors = extraData;
			} else {
				data = lodash.merge(data, extraData);
			}
		}
		res.status(status ?? errorObj.status).json(data);
	}

	/**
	 * Convert all the snake case keys to camel case.
	 *
	 * @param data
	 * @return mixed
	 */
	public static parseKeysToCamel(data: any) {
		Object.entries(data).forEach(([key, value]) => {
			delete data[key];
			data[lodash.camelCase(key)] = lodash.isObject(value) ? this.parseKeysToCamel(value) : value; // Repeat for multidimensional
		});

		return data;
	}

	/**
	 * Parse all the camel case keys to snake case.
	 *
	 * @param data
	 * @return mixed
	 */
	public static parseKeysToSnake(data: any) {
		Object.entries(data).forEach(([key, value]) => {
			delete data[key];
			data[lodash.snakeCase(key)] = lodash.isObject(value) ? this.parseKeysToSnake(value) : value; // Repeat for multidimensional
		});

		return data;
	}
}
