import type { LocaleTranslations } from "adminjs";

import common from "./common.json" with { type: "json" };
import CmsRole from "./cmsrole.json" with { type: "json" };
import CmsUser from "./cmsuser.json" with { type: "json" };

const enLocale: LocaleTranslations = {
	...common,
	resources: {
		CmsRole,
		CmsUser,
	},
};

export default enLocale;
