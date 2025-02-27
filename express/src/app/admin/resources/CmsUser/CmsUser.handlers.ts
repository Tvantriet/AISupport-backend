import { ActionRequest, ValidationError, PropertyErrors, ActionResponse } from "adminjs";
import CmsRole from "../../../models/CmsRole.entity.js";
import { isPOSTMethod } from "../../utils/admin.utils.js";
import Bcrypt from "../../../utils/Bcrypt.js";
import Session from "../../../models/Session.entity.js";

export const actionAfterHandler = async (response: ActionResponse) => {
	// remove password
	if (response?.record?.params?.password) response.record.params.password = "";
	return response;
};

export const addOrUpdateBeforeHandler = async (request: ActionRequest) => {
	const { payload = {} } = request;

	// We will do validations only for POST requests
	if (isPOSTMethod(request)) {
		const errors: PropertyErrors = {};
		const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
		const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

		// Validationerrors are asigned to "errors" object
		if (!payload.name) errors.name = { message: "Name is a required field" };
		if (!payload.email || !emailRegex.test(payload.email))
			errors.email = { message: "Please provide a valid email address" };
		if (payload.password && !passwordRegex.test(payload.password))
			errors.password = {
				message: `Please provide a secure password or phrase.\n
				Ensure string has two uppercase letters.\n
				Ensure string has one special case letter.\n
				Ensure string has two digits.\n
				Ensure string has three lowercase letters.\n
				Ensure string is of length 8.`,
			};
		if (payload.cmsrole && !(await CmsRole.findBy({ id: payload.cmsrole })))
			errors.cmsrole = { message: "Please provide a valid CMS role" };

		// We throw AdminJS ValidationError if there are errors in the payload
		if (Object.keys(errors).length) throw new ValidationError(errors);

		if (payload?.password) {
			payload.password = Bcrypt.make(payload.password);
		} else {
			delete request.payload?.password;
		}
	}

	if (payload?.cmsrole || payload["cmsRoles.0.id"]) {
		payload.cmsRoles = await CmsRole.find({
			where: {
				id: payload?.cmsrole || payload["cmsRoles.0.id"],
			},
		});

		if (payload?.id) {
			// Look for active session and assign the new role to the user
			await Session.updateUserRole(payload.id, payload.cmsRoles[0].slug);
		}
	}

	return request;
};
