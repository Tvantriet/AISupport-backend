/* eslint-disable no-param-reassign */
import ErrorReporting from "../../utils/ErrorReporting.js";
import { ActionResponse, buildFeature, FeatureType, ValidationError } from "adminjs";

/**
 * This feature allows to make errors catched by adminjs to become vissible
 * to cms users and report to gcloud.
 *
 * @returns {FeatureType} - The upload feature object.
 */
export const useResponseValidationErrorParser = (): FeatureType => {
	const after = async (response: ActionResponse) => {
		if (response.record && response.record.errors) {
			// Report the errors from DB to gcl
			if (response.record.errors.length) {
				ErrorReporting.report(new Error(response.record.errors));
				throw new ValidationError(response.record.errors);
			}
		}
		return response;
	};

	return buildFeature({
		actions: {
			new: { after: [after] },
			edit: { after: [after] },
		},
	});
};
