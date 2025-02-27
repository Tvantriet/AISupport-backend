import {
	ActionContext,
	ActionRequest,
	buildFeature,
	ErrorTypeEnum,
	FeatureType,
	PropertyErrors,
	ValidationError,
} from "adminjs";
import { isPOSTMethod } from "../utils/admin.utils.js";

/**
 * This feature is used to validate forms,
 * feature is best used before other features
 * @returns {FeatureType} - The formvalidation feature object.
 */
export const useFormValidation = (): FeatureType => {
	/**
	 * Validates the request payload
	 *
	 * @param {ActionRequest} request - The request object.
	 * @param {ActionContext} context - The context object.
	 * @returns {ActionRequest} - The request object.
	 */
	const validateHandler = async (request: ActionRequest, context: ActionContext) => {
		if (isPOSTMethod(request)) {
			const { payload } = request;
			const { properties = {} } = context.resource._decorated.options;
			const errorMessages: PropertyErrors = {};

			await Promise.all(
				Object.entries(properties)?.map(async ([property, options]) => {
					const value = payload[property];
					const errorsArray: string[] = [];

					// If property is not present, skip further validation
					if (!options.isRequired && !value) {
						// Skip validation
						return;
					}

					if (options.isRequired && !value) {
						errorsArray.push("is required");
					}

					// Min value
					if (options.validation?.min && value.length < options.validation.min) {
						errorsArray.push(`must be at least ${options.validation.min}`);
					}

					// Max value
					if (options.validation?.max && value.length > options.validation.max) {
						errorsArray.push(`must be at most peop ${options.validation.max}`);
					}

					// Regex
					if (options.validation?.regex && !options.validation.regex.test(value)) {
						errorsArray.push("is invalid");
					}

					// Max length
					if (options.validation?.maxLength && value.length > options.validation.maxLength) {
						errorsArray.push(`must be at most ${options.validation.maxLength} characters`);
					}

					// Custom validation
					if (options.validation?.customValidation) {
						const { passed, message } = await options.validation.customValidation(value, payload.id);
						if (!passed) errorsArray.push(message ?? "custom validation failed");
					}

					// Custom formatting
					if (options.validation?.format) {
						request.payload[property] = options.validation.format(value);
					}

					// Add error to errorMessages if there are validation errors
					if (errorsArray.length > 0) {
						const message = options.validation.message ?? `${property} ${errorsArray.join(", ")}`;
						errorMessages[property] = { type: ErrorTypeEnum.Record, message };
					}
				}),
			);

			// Throw AdminJS ValidationError if there are errors in the payload
			if (Object.keys(errorMessages).length) throw new ValidationError(errorMessages);
		}

		return request;
	};

	return buildFeature({
		actions: {
			new: { before: validateHandler },
			edit: { before: validateHandler },
		},
	});
};
