/* eslint-disable no-param-reassign */
import { ActionRequest, ValidationError, PropertyErrors } from "adminjs";
/**
 * A handler is a middleware function on the specific resource
 */
export const addOrUpdateBeforeHandler = async (request: ActionRequest) => {
	// no need to hash on GET requests, we'll remove passwords there anyway
	const { payload = {}, method } = request;
	if (method === "post") {
		// We only want to validate "post" requests
		if (method !== "post") return request;

		// We will store validation errors in an object, so that
		// we can throw multiple errors at the same time
		const errors: PropertyErrors = {};

		// We are doing validations and assigning errors to "errors" object
		if (!payload.name) errors.name = { message: "Name is a required field" };
		if (!payload.slug) errors.slug = { message: "Slug is a required field" };

		// We throw AdminJS ValidationError if there are errors in the payload
		if (Object.keys(errors).length) throw new ValidationError(errors);
	}

	return request;
};
