/* eslint-disable no-param-reassign */
import importExportFeature from "@adminjs/import-export";
import CmsUser from "../../../models/CmsUser.entity.js";
import { CreateResourceResult } from "../create-resource-result.type.js";
import { componentLoader } from "../../utils/components.bundler.js";
import { sidebarMenu } from "../../utils/router.js";
import { addOrUpdateBeforeHandler, actionAfterHandler } from "./CmsUser.handlers.js";
import { isAdminLevel } from "../../utils/admin.utils.js";
import { useUploadFeature } from "../../features/index.js";
import { useResponseValidationErrorParser } from "../../features/useResponseValidationErrorParser.js";

export const CreateCmsUserResource = (): CreateResourceResult<typeof CmsUser> => ({
	resource: CmsUser,
	features: [
		importExportFeature({ componentLoader }),
		useUploadFeature([{ property: "avatar" }]),
		useResponseValidationErrorParser(),
	],
	options: {
		navigation: sidebarMenu.auth,
		filterProperties: ["id", "name", "email", "createdAt", "updatedAt"],
		showProperties: ["id", "name", "cmsrole", "email", "createdAt", "updatedAt"],
		listProperties: ["id", "name", "cmsrole", "email", "createdAt", "updatedAt"],
		editProperties: ["email", "name", "cmsrole", "password", "avatar"],
		properties: {
			name: { isTitle: true },
			emailLookup: {
				isVisible: false,
			},
			passwordRecoveryToken: {
				isVisible: false,
			},
			avatar: {
				components: {
					edit: "DropZone",
					show: "DropZoneShow",
					list: "DropZoneShow",
				},
			},
			password: {
				type: "password",
				isVisible: {
					list: false,
					filter: false,
					show: false,
					edit: true, // we only show it in the edit view
				},
			},
			cmsrole: {
				type: "reference",
				reference: "CmsRole",
				components: {
					edit: "CmsRoleEdit",
					list: "CmsRoleBadge",
					show: "CmsRoleBadge",
				},
			},
		},

		actions: {
			new: {
				isAccessible: isAdminLevel,
				before: addOrUpdateBeforeHandler,
			},
			show: {
				showInDrawer: true,
				after: actionAfterHandler,
			},
			edit: {
				isAccessible: isAdminLevel,
				before: addOrUpdateBeforeHandler,
				after: actionAfterHandler,
			},
			delete: {
				isAccessible: isAdminLevel,
				guard: "deleteGuard",
			},
			list: {
				after: actionAfterHandler,
			},
		},
	},
});
