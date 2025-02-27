import AdminJS, { AdminJSOptions, ResourceOptions } from "adminjs";
import { dark, light } from "@adminjs/themes";
import locale from "./locale/index.js";
import themeBranding from "./theme.js";
import { CreateCmsRoleResource, CreateCmsUserResource } from "./resources/index.js";
import { Dashboard, Media, componentLoader } from "./utils/components.bundler.js";
import { mediaPageHandler } from "./views/media/handler.js";
import "./utils/components.bundler.js";

import { Database, Resource } from "@adminjs/typeorm";

AdminJS.registerAdapter({ Database, Resource });

export const generateAdminJSConfig = (): AdminJSOptions => ({
	locale,
	rootPath: "/admin",
	componentLoader,
	branding: {
		companyName: "Livewall CMS",
		favicon: "/images/favicon.ico",
		logo: "/images/logo.png",
		withMadeWithLove: false,
		theme: themeBranding,
	},
	defaultTheme: "light",
	availableThemes: [light, dark],
	assets: {
		styles: ["/css/admin-panel.css"],
		// scripts: process.env.APP_ENV === "production" ? ["/gtm.js"] : [],
	},
	settings: {
		defaultPerPage: 20,
	},
	resources: [CreateCmsUserResource(), CreateCmsRoleResource()],
	dashboard: {
		component: Dashboard,
	},
	pages: {
		media: {
			component: Media,
			handler: mediaPageHandler,
		},
	},
});
export const menu: Record<string, ResourceOptions["navigation"]> = {
	Data: { name: "Data", icon: "Folder" },
};
