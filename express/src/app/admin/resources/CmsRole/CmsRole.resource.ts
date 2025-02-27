import { CreateResourceResult } from "../create-resource-result.type.js";
import CmsRole from "../../../models/CmsRole.entity.js";
import { isAdminLevel } from "../../utils/admin.utils.js";
import { sidebarMenu } from "../../utils/router.js";
import { addOrUpdateBeforeHandler } from "./CmsRole.handlers.js";
import { useFormValidation, useResponseValidationErrorParser } from "../../features/index.js";

export const CreateCmsRoleResource = (): CreateResourceResult<typeof CmsRole> => {
	return {
		resource: CmsRole,
		features: [useFormValidation(), useResponseValidationErrorParser()],
		options: {
			navigation: sidebarMenu.auth,
			filterProperties: ["id", "name", "slug", "createdAt", "updatedAt"],
			showProperties: ["id", "name", "slug", "createdAt", "updatedAt"],
			listProperties: ["id", "name", "slug", "createdAt", "updatedAt"],
			editProperties: ["id", "name", "slug", "createdAt", "updatedAt"],
			actions: {
				new: {
					isAccessible: isAdminLevel,
					before: addOrUpdateBeforeHandler,
				},
				show: {
					showInDrawer: true,
				},
				edit: {
					isAccessible: isAdminLevel,
					before: addOrUpdateBeforeHandler,
				},
				delete: {
					isAccessible: isAdminLevel,
					guard: "deleteGuard",
				},
			},
			properties: {
				name: {
					isTitle: true,
					isRequired: true,
				},
				slug: {
					isRequired: true,
					validation: {
						maxLength: 64,
					},
				},
				permissions: { isVisible: false },
			},
		},
	};
};
